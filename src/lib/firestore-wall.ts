import { mapWallComment } from "@/lib/firestore-mappers";
import type { WallCommentRow } from "@/lib/firestore-types";
import { getFirestoreServer } from "@/lib/firestore-admin";
import { toErrorMessage, type DbResult } from "@/lib/firestore-shared";

export type WallComment = ReturnType<typeof mapWallComment>;

export async function fetchWallComments(): Promise<DbResult<WallComment[]>> {
  try {
    const snap = await getFirestoreServer()
      .collection("wall_comments")
      .orderBy("created_at", "desc")
      .limit(200)
      .get();

    return {
      data: snap.docs.map((doc) =>
        mapWallComment({ id: doc.id, ...doc.data() } as WallCommentRow),
      ),
      error: null,
    };
  } catch (e) {
    return { data: null, error: toErrorMessage(e) };
  }
}

export async function createWallComment(
  name: string,
  message: string,
): Promise<DbResult<WallComment>> {
  try {
    const ref = getFirestoreServer().collection("wall_comments").doc();
    const created_at = new Date().toISOString();
    await ref.set({
      name: name.trim(),
      message: message.trim(),
      created_at,
    });
    return {
      data: mapWallComment({
        id: ref.id,
        name: name.trim(),
        message: message.trim(),
        created_at,
      }),
      error: null,
    };
  } catch (e) {
    return { data: null, error: toErrorMessage(e) };
  }
}

export async function deleteWallComment(
  commentId: string,
): Promise<DbResult<true>> {
  try {
    await getFirestoreServer()
      .collection("wall_comments")
      .doc(commentId)
      .delete();
    return { data: true, error: null };
  } catch (e) {
    return { data: null, error: toErrorMessage(e) };
  }
}
