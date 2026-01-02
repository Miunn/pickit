import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Notification as NotificationData } from "@prisma/client";
import Notification from "./Notification";
import { markNotificationAsRead } from "@/actions/notifications";

export default function NotificationsDialog({
    notifications,
    setNotifications,
    children,
    open,
    onOpenChange,
}: {
    readonly notifications: NotificationData[];
    readonly setNotifications: React.Dispatch<React.SetStateAction<NotificationData[]>>;
    readonly children?: React.ReactNode;
    readonly open?: boolean;
    readonly onOpenChange?: (open: boolean) => void;
}) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent className="flex flex-col gap-0 p-0 sm:max-h-[min(640px,80vh)] sm:max-w-lg [&>button:last-child]:top-5">
                <DialogHeader className="contents space-y-0 text-left">
                    <DialogTitle className="border-b px-5 py-4 text-base">Notifications</DialogTitle>
                    <div className="overflow-y-auto">
                        <DialogDescription asChild>
                            <div className="px-1 py-1">
                                <div className="space-y-0.5">
                                    {notifications.length > 0 ? (
                                        notifications.map(notification => (
                                            <div key={notification.id} className="space-y-1">
                                                <Notification
                                                    notification={notification}
                                                    onRead={() => {
                                                        markNotificationAsRead(notification.id).then(() => {
                                                            setNotifications(
                                                                notifications.map(n =>
                                                                    n.id === notification.id
                                                                        ? { ...n, isRead: true }
                                                                        : n
                                                                )
                                                            );
                                                        });
                                                    }}
                                                />
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-center text-sm text-muted-foreground py-44">
                                            No notifications yet
                                        </div>
                                    )}
                                </div>
                            </div>
                        </DialogDescription>
                    </div>
                </DialogHeader>
            </DialogContent>
        </Dialog>
    );
}
