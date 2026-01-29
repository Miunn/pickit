import { Checkbox } from "@/components/ui/checkbox";
import { ColumnDef } from "@tanstack/react-table";

export type BillingHistory = {
    date: Date;
    plan: string;
    amount: number;
    status: string;
    paymentMethod: string;
}

export const historyColumns: ColumnDef<BillingHistory>[] = [
    {
        id: "select",
        header: ({ table }) => (
            <Checkbox
                checked={table.getIsAllPageRowsSelected()}
                onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
                aria-label="Select all"
            />
        ),
        cell: ({ row }) => (
            <Checkbox
                checked={row.getIsSelected()}
                onCheckedChange={(value) => row.toggleSelected(!!value)}
                aria-label="Select row"
            />
        ),
    },
    {
        accessorKey: "date",
        header: "Date",
        cell: ({ row, table }) => {
            const formatter = table.options.meta?.intl?.formatter;
            const date = new Date(row.original.date);

            if (formatter) {
                return <div className="capitalize">{formatter.dateTime(date, { dateStyle: "long" })}</div>
            }

            return <div>{date.toLocaleDateString()}</div>
        }
    },
    {
        accessorKey: "amount",
        header: "Amount",
        cell: ({ row }) => {
            return <div>{row.original.amount}</div>
        }
    },
    {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => {
            return <div>{row.original.status}</div>
        }
    }
]