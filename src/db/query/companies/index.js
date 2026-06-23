import { newUuid } from "../../utils";

export async function upsertCompany(db, company) {
  await db.runAsync(
    `
    INSERT INTO companies (
      uuid,
      name,
      owner_id,
      logo,
      phone,
      email,
      address,
      country,
      tax_pin,
      business_registration_number,
      website,
      default_tax_rate,
      currency,
      timezone,
      receipt_footer,
      created_at,
      updated_at,
      deleted_at
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)

    ON CONFLICT(uuid) DO UPDATE SET
      name = excluded.name,
      owner_id = excluded.owner_id,
      logo = excluded.logo,
      phone = excluded.phone,
      email = excluded.email,
      address = excluded.address,
      country = excluded.country,
      tax_pin = excluded.tax_pin,
      business_registration_number = excluded.business_registration_number,
      website = excluded.website,
      default_tax_rate = excluded.default_tax_rate,
      currency = excluded.currency,
      timezone = excluded.timezone,
      receipt_footer = excluded.receipt_footer,
      updated_at = excluded.updated_at,
      deleted_at = excluded.deleted_at
    `,
    [
      company.id,
      company.name,
      company.owner,
      company.logo,
      company.phone,
      company.email,
      company.address,
      company.country,
      company.tax_pin,
      company.business_registration_number,
      company.website,
      company.default_tax_rate,
      company.currency,
      company.timezone,
      company.receipt_footer,
      company.created_at,
      company.updated_at,
      company.deleted_at,
    ]
  );
}
export async function getCompany(db, companyId) {
  return await db.getFirstAsync(
    `
    SELECT *
    FROM companies
    WHERE uuid = ?
    `,
    [companyId]
  );
}

export async function upsertCompanyMember(
  db,
  company,
  member
) {
  await db.runAsync(
    `
    INSERT INTO company_members (
      uuid,
      company,
      user_id,
      username,
      email,
      role,
      is_active,
      joined_at
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)

    ON CONFLICT(uuid) DO UPDATE SET
      company = excluded.company,
      user_id = excluded.user_id,
      username = excluded.username,
      email = excluded.email,
      role = excluded.role,
      is_active = excluded.is_active,
      joined_at = excluded.joined_at
    `,
    [
      member.id,
      company,
      member.user.uuid,
      member.user.username,
      member.user.email,
      member.role,
      member.is_active ? 1 : 0,
      member.joined_at,
    ]
  );
}

export async function upsertCompanyMembers(
  db,
  company,
  members
) {
  await db.withTransactionAsync(async () => {
    for (const member of members) {
      await upsertCompanyMember(db,company, member);
    }
  });
}

export async function getCompanyMembers(
  db,
  companyId
) {
  return await db.getAllAsync(
    `
    SELECT *
    FROM company_members
    WHERE company = ?
      AND deleted_at IS NULL
    ORDER BY username ASC
    `,
    [companyId]
  );
}

export async function ensureLocalCompany(db, userUuid) {
  const existing = await db.getFirstAsync(
    `SELECT * FROM companies LIMIT 1`
  );

  const now = new Date().toISOString();

  // 1. If company exists → just update session
  if (existing) {
    await db.runAsync(
      `
      UPDATE app_session
      SET company_uuid = ?, updated_at = ?
      `,
      [existing.uuid, now]
    );

    return existing;
  }

  const companyUuid = newUuid();
  const companyName = "My Business";

  await db.runAsync("BEGIN TRANSACTION");

  try {
    // 2. Create company (use userUuid directly)
    await db.runAsync(
      `
      INSERT INTO companies (
        uuid,
        name,
        owner_id,
        created_at,
        updated_at
      )
      VALUES (?, ?, ?, ?, ?)
      `,
      [companyUuid, companyName, userUuid, now, now]
    );

    // 3. Add owner as member
    await db.runAsync(
      `
      INSERT INTO company_members (
        uuid,
        company,
        user_id,
        role,
        created_at,
        updated_at
      )
      VALUES (?, ?, ?, 'owner', ?, ?)
      `,
      [newUuid(), companyUuid, userUuid, now, now]
    );

    // 4. FIXED: update session cleanly using passed userUuid
    await db.runAsync(
      `
      INSERT INTO app_session (
        user_uuid,
        company_uuid,
        created_at,
        updated_at
      )
      VALUES (?, ?, ?, ?)
      `,
      [userUuid, companyUuid, now, now]
    );

    await db.runAsync("COMMIT");

    return {
      uuid: companyUuid,
      name: companyName,
      owner: userUuid,
    };

  } catch (error) {
    await db.runAsync("ROLLBACK");
    throw error;
  }
}
