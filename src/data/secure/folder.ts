import { FolderWithAccessToken } from "@/lib/definitions";
import { getCurrentSession } from "@/lib/session";
import { FolderTokenPermission } from "@prisma/client";
import bcrypt from "bcryptjs";

export enum FolderPermission {
  READ = "read",
  READ_MAP = "read_map",
  WRITE = "write",
  DELETE = "delete",
}

export async function enforceFolder(
  folder: FolderWithAccessToken,
  token?: string,
  hash?: string,
  permission: FolderPermission = FolderPermission.READ,
) {
  const user = await getCurrentSession();

  if (user.user && folder.createdById === user.user.id) {
    return true;
  }

  if (!token) {
    return false;
  }

  const matchingToken = folder.accessTokens.find((t) => t.token === token);

  if (!matchingToken || !matchingToken.isActive) {
    return false;
  }

  if (matchingToken.pinCode) {
    if (!hash) {
      return false;
    }

    const matchHash = await bcrypt.compare(matchingToken.pinCode, hash);

    if (!matchHash) {
      return false;
    }
  }

  if (permission === FolderPermission.READ_MAP) {
    return matchingToken.allowMap;
  }

  if (permission === FolderPermission.WRITE) {
    return matchingToken.permission === FolderTokenPermission.WRITE;
  }

  if (permission === FolderPermission.READ) {
    return true;
  }

  return false;
}
