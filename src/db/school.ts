import { db } from './index.ts';
import { schoolData } from './schema.ts';
import { eq, and } from 'drizzle-orm';

export async function getSchoolData(userId: number, dataKey = 'main') {
  try {
    const records = await db
      .select()
      .from(schoolData)
      .where(and(eq(schoolData.userId, userId), eq(schoolData.dataKey, dataKey)))
      .limit(1);

    return records[0]?.payload ?? null;
  } catch (error) {
    console.error("Database query getSchoolData failed:", error);
    throw new Error("Database query getSchoolData failed", { cause: error });
  }
}

export async function saveSchoolData(userId: number, payload: any, dataKey = 'main') {
  try {
    const existing = await db
      .select({ id: schoolData.id })
      .from(schoolData)
      .where(and(eq(schoolData.userId, userId), eq(schoolData.dataKey, dataKey)))
      .limit(1);

    if (existing.length > 0) {
      await db
        .update(schoolData)
        .set({
          payload,
          updatedAt: new Date(),
        })
        .where(eq(schoolData.id, existing[0].id));
    } else {
      await db.insert(schoolData).values({
        userId,
        dataKey,
        payload,
      });
    }
    return { success: true };
  } catch (error) {
    console.error("Database query saveSchoolData failed:", error);
    throw new Error("Database query saveSchoolData failed", { cause: error });
  }
}
