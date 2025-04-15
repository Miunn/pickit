'use server'

import { prisma } from "@/lib/prisma";
import { FolderTokenPermission } from "@prisma/client";
import { FolderWithAccessToken, FolderWithCreatedBy, FolderWithImagesWithFolderAndComments, FolderWithVideosWithFolderAndComments } from "@/lib/definitions";
import * as bcrypt from "bcryptjs";

export async function validateShareToken(
  folderId: string, 
  token: string, 
  type: "accessToken" | "personAccessToken", 
  hashedPinCode?: string | null
): Promise<{ 
  error: string | null, 
  folder: (FolderWithCreatedBy & FolderWithImagesWithFolderAndComments & FolderWithVideosWithFolderAndComments & FolderWithAccessToken) | null, 
  permission?: FolderTokenPermission 
}> {
  if (!prisma) {
    return { error: "Database connection error", folder: null };
  }
  
  let accessToken;
  if (type === "accessToken") {
    accessToken = await prisma!.accessToken.findUnique({
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
            images: {
              include: {
                folder: true,
                comments: { include: { createdBy: true } }
              }
            },
            videos: {
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
  } else if (type === "personAccessToken") {
    accessToken = await prisma!.personAccessToken.findUnique({
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
            images: {
              include: {
                folder: true,
                comments: { include: { createdBy: true } }
              }
            },
            videos: {
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
  } else {
    return { error: "invalid-token-type", folder: null };
  }

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

  return { error: null, folder: { ...accessToken.folder, AccessToken: [] }, permission: accessToken.permission };
}

export async function getFolderFullFromAccessTokenServer(
  folderId: string, 
  token: string, 
  type: "accessToken" | "personAccessToken"
): Promise<{ 
  error: string | null, 
  folder: (FolderWithImagesWithFolderAndComments & FolderWithCreatedBy) | null 
}> {
  if (!prisma) {
    return { error: "Database connection error", folder: null };
  }
  
  let accessToken;

  if (type === "accessToken") {
    accessToken = await prisma!.accessToken.findUnique({
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
            images: { 
              include: { 
                folder: true, 
                comments: { include: { createdBy: true } } 
              } 
            }, 
            createdBy: true 
          } 
        }
      }
    });
  } else if (type === "personAccessToken") {
    accessToken = await prisma!.personAccessToken.findUnique({
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
            images: { 
              include: { 
                folder: true, 
                comments: { include: { createdBy: true } } 
              } 
            }, 
            createdBy: true 
          } 
        }
      }
    });
  }

  if (!accessToken) {
    return { error: "invalid-token", folder: null };
  }

  return { error: null, folder: accessToken.folder };
} 