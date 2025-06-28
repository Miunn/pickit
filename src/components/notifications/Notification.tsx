import { Link } from "@/i18n/navigation";
import { NotificationType, Notification as NotificationData } from "@prisma/client"
import { useFormatter } from "next-intl"

export default function Notification({ notification, onRead }: { notification: NotificationData, onRead: () => void }) {
    const formatter = useFormatter();

    switch (notification.type) {
        case NotificationType.FOLDER_SHARED:
            return (
                <div onClick={onRead} className="flex items-center justify-between gap-2 hover:bg-muted rounded-lg p-4">
                    <div>
                        <p><span className="font-bold text-foreground">{notification.authorName}</span> shared <span className="font-bold text-foreground">{notification.folderName}</span> with you</p>
                        <p className="text-sm text-muted-foreground">{formatter.dateTime(notification.createdAt, { dateStyle: "medium", timeStyle: "short" })}</p>
                    </div>
                    {notification.isRead ? null : <div className="w-2 h-2 bg-primary rounded-full" />}
                </div>
            )

        case NotificationType.FILE_UPLOADED:
            return (
                <div onClick={onRead} className="flex items-center justify-between gap-2 hover:bg-muted rounded-lg p-4">
                    <div>
                        <p><span className="font-bold text-foreground">{notification.authorName}</span> uploaded some files to <span className="font-bold text-foreground">{notification.folderName}</span>. Check them out!</p>
                        <p className="text-sm text-muted-foreground">{formatter.dateTime(notification.createdAt, { dateStyle: "medium", timeStyle: "short" })}</p>
                    </div>
                    {notification.isRead ? null : <div className="w-2 h-2 bg-primary rounded-full" />}
                </div>
            );

        default:
            return null;
    }
}