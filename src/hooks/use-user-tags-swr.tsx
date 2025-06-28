import { FolderTag } from "@prisma/client";
import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then(res => res.json());

const useUserTagsSWR = () => {
    const { data, error, isLoading, mutate } = useSWR<FolderTag[]>("/api/user/get-created-tags", fetcher, {
        revalidateOnFocus: true,
        refreshInterval: 0,
    });

    return {
        data: data as FolderTag[],
        error: error as Error,
        isLoading: isLoading,
        mutate
    }
}

export default useUserTagsSWR;