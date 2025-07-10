import { BillingHistory } from "@/components/billing/history-columns";
import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then(res => res.json());

const useBillingHistorySWR = () => {
    const { data, error, isLoading, mutate } = useSWR<BillingHistory[]>("/api/stripe/billing/history", fetcher, {
        revalidateOnFocus: true
    });

    return {
        data: data as BillingHistory[],
        error: error as Error,
        isLoading: isLoading,
        mutate
    }
}

export default useBillingHistorySWR;