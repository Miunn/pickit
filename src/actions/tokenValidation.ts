'use server'

import { prisma } from "@/lib/prisma";
import { FolderTokenPermission } from "@prisma/client";
import { FolderWithAccessToken, FolderWithCreatedBy, FolderWithFilesWithFolderAndComments } from "@/lib/definitions";
import * as bcrypt from "bcryptjs";

export async function validateShareToken(
  folderId: string,
  token: string,
  hashedPinCode?: string | null
): Promise<{
  error: string | null,
  folder: (FolderWithCreatedBy & FolderWithFilesWithFolderAndComments & FolderWithAccessToken) | null,
  permission?: FolderTokenPermission
}> {
  const accessToken = await prisma.accessToken.findUnique({
    where: {
      token: token,
      folderId: folderId,
      expires: {
        gte: new Date()
      }
    },
    include: {
      folder: {
        include: {
          files: {
            include: {
              folder: true,
              comments: { include: { createdBy: true } }
            }
          },
          createdBy: true
        }
      }
    },
    omit: {
      pinCode: false
    }
  });

  if (!accessToken || !accessToken.isActive) {
    return { error: "invalid-token", folder: null };
  }

  if (accessToken.locked && !hashedPinCode) {
    return { error: "code-needed", folder: null };
  }

  if (accessToken.locked) {
    if (!hashedPinCode) {
      return { error: "wrong-pin", folder: null };
    }

    const match = bcrypt.compareSync(accessToken.pinCode as string, hashedPinCode);

    if (!match) {
      return { error: "wrong-pin", folder: null };
    }
  }

  return { error: null, folder: { ...accessToken.folder, accessTokens: [] }, permission: accessToken.permission };
}
