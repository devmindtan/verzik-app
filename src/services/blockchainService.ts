import {
  Tenant,
  Operator,
  Document,
  CoSignPolicy,
  BlockchainEvent,
  RecoveryAlias,
} from "../types";
import { supabase } from "../lib/supabase";

let eventIdCounter = 0;
let blockNumber = 1000;

function nextBlock(): number {
  return ++blockNumber;
}

function randomTxHash(): string {
  return (
    "0x" +
    Array.from({ length: 64 }, () =>
      Math.floor(Math.random() * 16).toString(16),
    ).join("")
  );
}

async function addEvent(
  type: BlockchainEvent["type"],
  actor: string,
  description: string,
  tenantId?: string,
  data?: Record<string, any>,
) {
  const id = `evt_${++eventIdCounter}`;
  const event = {
    id,
    tx_hash: randomTxHash(),
    type,
    actor,
    description,
    timestamp: new Date().toISOString(),
    block_number: nextBlock(),
    gas_used: Math.floor(Math.random() * 200000) + 50000,
    tenant_id: tenantId || null,
    data: data || {},
  };

  await supabase.from("blockchain_events").insert(event);
}

// ============ TENANT MANAGEMENT ============
export const blockchainService = {
  getTenants: async (): Promise<Tenant[]> => {
    const { data } = await supabase
      .from("tenants")
      .select("*")
      .order("created_at", { ascending: true });
    return (data || []).map(mapTenant);
  },

  getTenant: async (id: string): Promise<Tenant | undefined> => {
    const { data } = await supabase
      .from("tenants")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    return data ? mapTenant(data) : undefined;
  },

  createTenant: async (
    name: string,
    admin: string,
    operatorManager: string,
    treasury: string,
  ): Promise<Tenant> => {
    const id = `t${Date.now()}`;
    const row = {
      id,
      name,
      admin,
      operator_manager: operatorManager,
      treasury,
      is_active: true,
      min_operator_stake: 1,
      unstake_cooldown: 7 * 24 * 60 * 60,
    };
    await supabase.from("tenants").insert(row);
    await addEvent("tenant_created", admin, `Tenant "${name}" created`, id);
    return mapTenant(row as any);
  },

  setTenantStatus: async (
    tenantId: string,
    isActive: boolean,
    actor: string,
  ) => {
    const { data: tenant } = await supabase
      .from("tenants")
      .select("*")
      .eq("id", tenantId)
      .maybeSingle();
    if (tenant) {
      await supabase
        .from("tenants")
        .update({ is_active: isActive })
        .eq("id", tenantId);
      await addEvent(
        "config_updated",
        actor,
        `Tenant "${tenant.name}" ${isActive ? "activated" : "deactivated"}`,
        tenantId,
      );
    }
  },

  updateTenantConfig: async (
    tenantId: string,
    minStake: number,
    cooldown: number,
    actor: string,
  ) => {
    await supabase
      .from("tenants")
      .update({
        min_operator_stake: minStake,
        unstake_cooldown: cooldown,
      })
      .eq("id", tenantId);
    await addEvent(
      "config_updated",
      actor,
      `Tenant config updated: minStake=${minStake}, cooldown=${cooldown}s`,
      tenantId,
    );
  },

  setTreasury: async (tenantId: string, newTreasury: string, actor: string) => {
    const { data: tenant } = await supabase
      .from("tenants")
      .select("*")
      .eq("id", tenantId)
      .maybeSingle();
    if (tenant) {
      const old = tenant.treasury;
      await supabase
        .from("tenants")
        .update({ treasury: newTreasury })
        .eq("id", tenantId);
      await addEvent(
        "treasury_updated",
        actor,
        `Treasury changed from ${old} to ${newTreasury}`,
        tenantId,
        { oldTreasury: old, newTreasury },
      );
    }
  },

  setOperatorManager: async (
    tenantId: string,
    newManager: string,
    actor: string,
  ) => {
    const { data: tenant } = await supabase
      .from("tenants")
      .select("*")
      .eq("id", tenantId)
      .maybeSingle();
    if (tenant) {
      const old = tenant.operator_manager;
      await supabase
        .from("tenants")
        .update({ operator_manager: newManager })
        .eq("id", tenantId);
      await addEvent(
        "role_granted",
        actor,
        `Operator Manager changed from ${old} to ${newManager}`,
        tenantId,
      );
    }
  },

  // ============ OPERATOR MANAGEMENT ============
  getAllOperators: async (): Promise<Operator[]> => {
    const { data } = await supabase
      .from("operators")
      .select("*")
      .order("joined_at", { ascending: true });
    return (data || []).map(mapOperator);
  },

  getOperators: async (tenantId: string): Promise<Operator[]> => {
    const { data } = await supabase
      .from("operators")
      .select("*")
      .eq("tenant_id", tenantId)
      .order("joined_at", { ascending: true });
    return (data || []).map(mapOperator);
  },

  getOperator: async (
    tenantId: string,
    address: string,
  ): Promise<Operator | undefined> => {
    const { data } = await supabase
      .from("operators")
      .select("*")
      .eq("tenant_id", tenantId)
      .eq("address", address)
      .maybeSingle();
    return data ? mapOperator(data) : undefined;
  },

  joinAsOperator: async (
    tenantId: string,
    address: string,
    stakeAmount: number,
  ): Promise<Operator> => {
    const id = `op_${Math.random().toString(36).substr(2, 9)}`;
    const row = {
      id,
      tenant_id: tenantId,
      address,
      stake_amount: stakeAmount,
      is_active: true,
      joined_at: new Date().toISOString(),
    };
    await supabase.from("operators").insert(row);
    await addEvent(
      "operator_joined",
      address,
      `Operator joined with ${stakeAmount} ETH stake`,
      tenantId,
      { stakeAmount },
    );
    return mapOperator(row as any);
  },

  topUpStake: async (tenantId: string, address: string, amount: number) => {
    const { data: op } = await supabase
      .from("operators")
      .select("*")
      .eq("tenant_id", tenantId)
      .eq("address", address)
      .maybeSingle();
    if (op) {
      const newTotal = Number(op.stake_amount) + amount;
      await supabase
        .from("operators")
        .update({ stake_amount: newTotal })
        .eq("id", op.id);
      await addEvent(
        "operator_staked",
        address,
        `Operator topped up ${amount} ETH (total: ${newTotal})`,
        tenantId,
        { amount, newTotal },
      );
    }
  },

  requestUnstake: async (tenantId: string, address: string) => {
    const { data: op } = await supabase
      .from("operators")
      .select("*")
      .eq("tenant_id", tenantId)
      .eq("address", address)
      .maybeSingle();
    if (op) {
      const { data: tenant } = await supabase
        .from("tenants")
        .select("*")
        .eq("id", tenantId)
        .maybeSingle();
      if (tenant) {
        const cooldown = tenant.unstake_cooldown || 604800;
        const pendingAt = new Date(Date.now() + cooldown * 1000).toISOString();
        await supabase
          .from("operators")
          .update({ pending_unstake_at: pendingAt })
          .eq("id", op.id);
        await addEvent(
          "operator_unstake_requested",
          address,
          `Unstake requested, available at ${new Date(pendingAt).toLocaleString()}`,
          tenantId,
        );
      }
    }
  },

  executeUnstake: async (tenantId: string, address: string) => {
    const { data: op } = await supabase
      .from("operators")
      .select("*")
      .eq("tenant_id", tenantId)
      .eq("address", address)
      .maybeSingle();
    if (
      op &&
      op.pending_unstake_at &&
      new Date() >= new Date(op.pending_unstake_at)
    ) {
      const amount = Number(op.stake_amount);
      await supabase
        .from("operators")
        .update({ stake_amount: 0, is_active: false, pending_unstake_at: null })
        .eq("id", op.id);
      await addEvent(
        "operator_unstaked",
        address,
        `Operator unstaked ${amount} ETH`,
        tenantId,
        { amount },
      );
    }
  },

  setOperatorStatus: async (
    tenantId: string,
    address: string,
    isActive: boolean,
    actor: string,
  ) => {
    const { data: op } = await supabase
      .from("operators")
      .select("*")
      .eq("tenant_id", tenantId)
      .eq("address", address)
      .maybeSingle();
    if (op) {
      await supabase
        .from("operators")
        .update({ is_active: isActive, pending_unstake_at: null })
        .eq("id", op.id);
      await addEvent(
        "operator_status_changed",
        actor,
        `Operator ${address} ${isActive ? "activated" : "deactivated"}`,
        tenantId,
        { operatorAddress: address, isActive },
      );
    }
  },

  slashOperator: async (
    tenantId: string,
    address: string,
    reason: string,
    actor: string,
  ) => {
    const { data: op } = await supabase
      .from("operators")
      .select("*")
      .eq("tenant_id", tenantId)
      .eq("address", address)
      .maybeSingle();
    const { data: tenant } = await supabase
      .from("tenants")
      .select("*")
      .eq("id", tenantId)
      .maybeSingle();
    if (op && tenant) {
      const slashedAmount = Number(op.stake_amount);
      await supabase
        .from("operators")
        .update({ stake_amount: 0, is_active: false, pending_unstake_at: null })
        .eq("id", op.id);
      await addEvent(
        "operator_slashed",
        actor,
        `Operator slashed: ${slashedAmount} ETH seized. Reason: ${reason}`,
        tenantId,
        {
          operatorAddress: address,
          slashedAmount,
          reason,
          treasury: tenant.treasury,
        },
      );
    }
  },

  softSlashOperator: async (
    tenantId: string,
    address: string,
    penaltyBps: number,
    reason: string,
    actor: string,
  ) => {
    const { data: op } = await supabase
      .from("operators")
      .select("*")
      .eq("tenant_id", tenantId)
      .eq("address", address)
      .maybeSingle();
    const { data: tenant } = await supabase
      .from("tenants")
      .select("*")
      .eq("id", tenantId)
      .maybeSingle();
    if (op && tenant) {
      const slashAmount = (Number(op.stake_amount) * penaltyBps) / 10000;
      const remaining = Number(op.stake_amount) - slashAmount;
      const isActive = remaining >= Number(tenant.min_operator_stake);
      await supabase
        .from("operators")
        .update({
          stake_amount: remaining,
          is_active: isActive,
          pending_unstake_at: null,
        })
        .eq("id", op.id);
      await addEvent(
        "operator_soft_slashed",
        actor,
        `Operator soft-slashed: ${slashAmount.toFixed(4)} ETH (${penaltyBps / 100}%). Reason: ${reason}`,
        tenantId,
        {
          operatorAddress: address,
          slashAmount,
          penaltyBps,
          remainingStake: remaining,
        },
      );
    }
  },

  // ============ DOCUMENT MANAGEMENT ============
  getAllDocuments: async (): Promise<Document[]> => {
    const { data } = await supabase
      .from("documents")
      .select("*")
      .order("issued_at", { ascending: false });
    return (data || []).map(mapDocument);
  },

  getDocuments: async (tenantId: string): Promise<Document[]> => {
    const { data } = await supabase
      .from("documents")
      .select("*")
      .eq("tenant_id", tenantId)
      .order("issued_at", { ascending: false });
    return (data || []).map(mapDocument);
  },

  getDocument: async (
    tenantId: string,
    fileHash: string,
  ): Promise<Document | undefined> => {
    const { data } = await supabase
      .from("documents")
      .select("*")
      .eq("tenant_id", tenantId)
      .eq("file_hash", fileHash)
      .maybeSingle();
    if (!data) return undefined;
    const doc = mapDocument(data);
    const { data: sigs } = await supabase
      .from("document_signatures")
      .select("*")
      .eq("document_id", data.id)
      .order("signed_at", { ascending: true });
    doc.coSigners = (sigs || []).map((s: any) => s.signer_address);
    return doc;
  },

  getDocumentByHash: async (fileHash: string): Promise<Document | null> => {
    const { data } = await supabase
      .from("documents")
      .select("*")
      .eq("file_hash", fileHash)
      .maybeSingle();
    if (!data) return null;
    const doc = mapDocument(data);
    const { data: sigs } = await supabase
      .from("document_signatures")
      .select("*")
      .eq("document_id", data.id)
      .order("signed_at", { ascending: true });
    doc.coSigners = (sigs || []).map((s: any) => s.signer_address);
    return doc;
  },

  registerDocument: async (
    tenantId: string,
    fileHash: string,
    fileName: string,
    docType: Document["docType"],
    issuedBy: string,
    metadata?: Document["metadata"],
  ): Promise<Document> => {
    const row = {
      tenant_id: tenantId,
      file_hash: fileHash,
      file_name: fileName,
      doc_type: docType,
      issued_by: issuedBy,
      issued_at: new Date().toISOString(),
      is_valid: true,
      co_sign_qualified: false,
      recipient_address: metadata?.recipient || "",
      metadata_amount: metadata?.amount || 0,
      metadata_recipient: metadata?.recipient || "",
    };
    const { data } = await supabase
      .from("documents")
      .insert(row)
      .select()
      .single();
    const doc = mapDocument(data);

    // Add primary signature
    await supabase.from("document_signatures").insert({
      document_id: data.id,
      signer_address: issuedBy,
      signature_type: "primary",
    });
    doc.coSigners = [issuedBy];

    await addEvent(
      "document_anchored",
      issuedBy,
      `Document "${fileName}" anchored on-chain`,
      tenantId,
      { fileHash, docType },
    );
    return doc;
  },

  coSignDocument: async (
    tenantId: string,
    fileHash: string,
    signer: string,
  ): Promise<Document | null> => {
    const { data: docRow } = await supabase
      .from("documents")
      .select("*")
      .eq("tenant_id", tenantId)
      .eq("file_hash", fileHash)
      .maybeSingle();
    if (!docRow) return null;

    // Check if already signed
    const { data: existingSig } = await supabase
      .from("document_signatures")
      .select("*")
      .eq("document_id", docRow.id)
      .eq("signer_address", signer)
      .maybeSingle();
    if (existingSig) return mapDocument(docRow);

    // Add co-signature
    await supabase.from("document_signatures").insert({
      document_id: docRow.id,
      signer_address: signer,
      signature_type: "cosign",
    });

    await addEvent(
      "document_cosigned",
      signer,
      `Document co-signed`,
      tenantId,
      { fileHash },
    );

    // Check co-sign policy
    const { data: policies } = await supabase
      .from("co_sign_policies")
      .select("*")
      .eq("tenant_id", tenantId)
      .eq("doc_type", docRow.doc_type);
    const policy = policies?.[0];
    if (policy) {
      const { data: sigs } = await supabase
        .from("document_signatures")
        .select("*")
        .eq("document_id", docRow.id);
      const signerCount = sigs?.length || 0;
      if (signerCount >= policy.min_signers && !docRow.co_sign_qualified) {
        await supabase
          .from("documents")
          .update({ co_sign_qualified: true })
          .eq("id", docRow.id);
        await addEvent(
          "document_qualified",
          signer,
          `Document reached co-sign qualification`,
          tenantId,
          { fileHash },
        );
      }
    }

    // Return updated doc
    const { data: updated } = await supabase
      .from("documents")
      .select("*")
      .eq("id", docRow.id)
      .maybeSingle();
    return updated ? mapDocument(updated) : null;
  },

  revokeDocument: async (
    tenantId: string,
    fileHash: string,
    revokedBy: string,
  ) => {
    const { data: doc } = await supabase
      .from("documents")
      .select("*")
      .eq("tenant_id", tenantId)
      .eq("file_hash", fileHash)
      .maybeSingle();
    if (doc) {
      await supabase
        .from("documents")
        .update({ is_valid: false })
        .eq("id", doc.id);
      await addEvent(
        "document_revoked",
        revokedBy,
        `Document "${doc.file_name}" revoked`,
        tenantId,
        { fileHash },
      );
    }
  },

  // ============ CO-SIGN POLICY ============
  getCoSignPolicies: async (tenantId: string): Promise<CoSignPolicy[]> => {
    const { data } = await supabase
      .from("co_sign_policies")
      .select("*")
      .eq("tenant_id", tenantId);
    return (data || []).map(mapPolicy);
  },

  setCoSignPolicy: async (policy: CoSignPolicy, actor: string) => {
    const { data: existing } = await supabase
      .from("co_sign_policies")
      .select("*")
      .eq("tenant_id", policy.tenantId)
      .eq("doc_type", policy.docType);
    const row = {
      id: existing?.[0]?.id || `pol_${Date.now()}`,
      tenant_id: policy.tenantId,
      doc_type: policy.docType,
      enabled: policy.enabled,
      min_signers: policy.minSigners,
      required_roles: policy.requiredRoles,
      whitelisted_operators: policy.whitelistedOperators,
    };

    if (existing && existing.length > 0) {
      await supabase.from("co_sign_policies").update(row).eq("id", row.id);
    } else {
      await supabase.from("co_sign_policies").insert(row);
    }
    await addEvent(
      "policy_updated",
      actor,
      `Co-sign policy updated for "${policy.docType}"`,
      policy.tenantId,
      { docType: policy.docType, minSigners: policy.minSigners },
    );
  },

  // ============ RECOVERY ============
  getRecoveryAliases: async (tenantId: string): Promise<RecoveryAlias[]> => {
    const { data } = await supabase
      .from("recovery_aliases")
      .select("*")
      .eq("tenant_id", tenantId);
    return (data || []).map(mapRecovery);
  },

  recoverOperator: async (
    tenantId: string,
    fromAddress: string,
    toAddress: string,
    recoveredBy: string,
  ): Promise<RecoveryAlias> => {
    const { data: op } = await supabase
      .from("operators")
      .select("*")
      .eq("tenant_id", tenantId)
      .eq("address", fromAddress)
      .maybeSingle();
    if (op) {
      await supabase
        .from("operators")
        .update({ address: toAddress })
        .eq("id", op.id);
    }

    const alias = {
      id: `rec_${Date.now()}`,
      tenant_id: tenantId,
      from_address: fromAddress,
      to_address: toAddress,
      recovered_by: recoveredBy,
    };
    await supabase.from("recovery_aliases").insert(alias);
    await addEvent(
      "operator_recovered",
      recoveredBy,
      `Operator recovered: ${fromAddress.slice(0, 10)}... -> ${toAddress.slice(0, 10)}...`,
      tenantId,
      { fromAddress, toAddress },
    );
    return mapRecovery(alias as any);
  },

  // ============ EVENTS / TRANSACTIONS ============
  getEvents: async (): Promise<BlockchainEvent[]> => {
    const { data } = await supabase
      .from("blockchain_events")
      .select("*")
      .order("block_number", { ascending: false });
    return (data || []).map(mapEvent);
  },

  getEventsByTenant: async (tenantId: string): Promise<BlockchainEvent[]> => {
    const { data } = await supabase
      .from("blockchain_events")
      .select("*")
      .eq("tenant_id", tenantId)
      .order("block_number", { ascending: false });
    return (data || []).map(mapEvent);
  },

  getEventsByActor: async (actor: string): Promise<BlockchainEvent[]> => {
    const { data } = await supabase
      .from("blockchain_events")
      .select("*")
      .eq("actor", actor)
      .order("block_number", { ascending: false });
    return (data || []).map(mapEvent);
  },

  searchTransactions: async (query: string): Promise<BlockchainEvent[]> => {
    const q = query.toLowerCase();
    const { data } = await supabase
      .from("blockchain_events")
      .select("*")
      .order("block_number", { ascending: false });
    return (data || [])
      .filter(
        (e: any) =>
          e.tx_hash.toLowerCase().includes(q) ||
          e.actor.toLowerCase().includes(q) ||
          e.description.toLowerCase().includes(q) ||
          e.type.toLowerCase().includes(q) ||
          (e.tenant_id && e.tenant_id.toLowerCase().includes(q)),
      )
      .map(mapEvent);
  },

  getEventStatistics: async () => {
    const { data } = await supabase.from("blockchain_events").select("*");
    const events = data || [];
    return {
      totalEvents: events.length,
      byType: events.reduce(
        (acc: Record<string, number>, e: any) => {
          acc[e.type] = (acc[e.type] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>,
      ),
      uniqueActors: new Set(events.map((e: any) => e.actor)).size,
      totalGasUsed: events.reduce(
        (sum: number, e: any) => sum + (e.gas_used || 0),
        0,
      ),
    };
  },

  // ============ RECOVERY DELEGATE ============
  setRecoveryDelegate: async (
    tenantId: string,
    operatorAddress: string,
    delegateAddress: string,
  ) => {
    const { data: op } = await supabase
      .from("operators")
      .select("*")
      .eq("tenant_id", tenantId)
      .eq("address", operatorAddress)
      .maybeSingle();
    if (op) {
      await supabase
        .from("operators")
        .update({ recovery_delegate: delegateAddress })
        .eq("id", op.id);
      await addEvent(
        "operator_recovery_delegate_updated",
        operatorAddress,
        `Recovery delegate set to ${delegateAddress.slice(0, 10)}...`,
        tenantId,
        { delegateAddress },
      );
    }
  },

  // ============ OPERATOR METADATA ============
  updateOperatorMetadata: async (
    tenantId: string,
    operatorAddress: string,
    metadataURI: string,
  ) => {
    const { data: op } = await supabase
      .from("operators")
      .select("*")
      .eq("tenant_id", tenantId)
      .eq("address", operatorAddress)
      .maybeSingle();
    if (op) {
      await supabase
        .from("operators")
        .update({ metadata_uri: metadataURI })
        .eq("id", op.id);
      await addEvent(
        "operator_metadata_updated",
        operatorAddress,
        `Operator metadata updated`,
        tenantId,
        { metadataURI },
      );
    }
  },

  // ============ VIOLATION PENALTIES ============
  getViolationPenalties: async (tenantId: string) => {
    const { data } = await supabase
      .from("violation_penalties")
      .select("*")
      .eq("tenant_id", tenantId);
    return (data || []).map((p: any) => ({
      id: p.id,
      tenantId: p.tenant_id,
      violationCode: p.violation_code,
      penaltyBps: p.penalty_bps,
      description: p.description || "",
      createdAt: new Date(p.created_at),
    }));
  },

  setViolationPenalty: async (
    tenantId: string,
    violationCode: string,
    penaltyBps: number,
    description: string,
    actor: string,
  ) => {
    const { data: existing } = await supabase
      .from("violation_penalties")
      .select("*")
      .eq("tenant_id", tenantId)
      .eq("violation_code", violationCode);
    const row = {
      id: existing?.[0]?.id || `vp_${Date.now()}`,
      tenant_id: tenantId,
      violation_code: violationCode,
      penalty_bps: penaltyBps,
      description,
    };
    if (existing && existing.length > 0) {
      await supabase.from("violation_penalties").update(row).eq("id", row.id);
    } else {
      await supabase.from("violation_penalties").insert(row);
    }
    await addEvent(
      "config_updated",
      actor,
      `Violation penalty set: ${violationCode} = ${penaltyBps / 100}%`,
      tenantId,
      { violationCode, penaltyBps },
    );
  },

  // ============ VERIFY DOCUMENT ============
  verifyDocument: async (
    fileHash: string,
  ): Promise<{
    found: boolean;
    document: Document | null;
    message: string;
  }> => {
    const doc = await blockchainService.getDocumentByHash(fileHash);
    if (doc) {
      return {
        found: true,
        document: doc,
        message:
          "Document found on-chain. Verification would be performed by smart contract.",
      };
    }
    return {
      found: false,
      document: null,
      message:
        "Document not found. In production, this would query the blockchain directly.",
    };
  },
};

// ============ MAPPERS ============
function mapTenant(row: any): Tenant {
  return {
    id: row.id,
    name: row.name,
    admin: row.admin,
    operatorManager: row.operator_manager,
    treasury: row.treasury,
    isActive: row.is_active,
    createdAt: new Date(row.created_at),
    config: {
      minOperatorStake: Number(row.min_operator_stake),
      unstakeCooldown: row.unstake_cooldown,
    },
  };
}

function mapOperator(row: any): Operator {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    address: row.address,
    stakeAmount: Number(row.stake_amount),
    isActive: row.is_active,
    joinedAt: new Date(row.joined_at),
    metadataURI: row.metadata_uri || undefined,
    pendingUnstakeAt: row.pending_unstake_at
      ? new Date(row.pending_unstake_at)
      : undefined,
    recoveryDelegate: row.recovery_delegate || undefined,
  };
}

function mapDocument(row: any): Document {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    fileHash: row.file_hash,
    fileName: row.file_name,
    docType: row.doc_type,
    issuedBy: row.issued_by,
    issuedAt: new Date(row.issued_at),
    isValid: row.is_valid,
    coSigners: [],
    coSignQualified: row.co_sign_qualified,
    metadata: {
      amount: Number(row.metadata_amount) || undefined,
      recipient: row.metadata_recipient || undefined,
    },
  };
}

function mapPolicy(row: any): CoSignPolicy {
  return {
    tenantId: row.tenant_id,
    docType: row.doc_type,
    enabled: row.enabled,
    minSigners: row.min_signers,
    requiredRoles: row.required_roles || [],
    whitelistedOperators: row.whitelisted_operators || [],
  };
}

function mapEvent(row: any): BlockchainEvent {
  return {
    id: row.id,
    txHash: row.tx_hash,
    tenantId: row.tenant_id || undefined,
    type: row.type,
    actor: row.actor,
    description: row.description,
    timestamp: new Date(row.timestamp),
    blockNumber: row.block_number,
    gasUsed: row.gas_used,
    data: row.data || {},
  };
}

function mapRecovery(row: any): RecoveryAlias {
  return {
    tenantId: row.tenant_id,
    fromAddress: row.from_address,
    toAddress: row.to_address,
    recoveredAt: new Date(row.recovered_at),
    recoveredBy: row.recovered_by,
  };
}
