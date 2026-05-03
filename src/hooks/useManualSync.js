import { useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { triggerSync } from "@/src/store/features/syncSlice";

export function useManualSync() {
    const dispatch = useDispatch();
    const isSyncing = useSelector(state => state.sync.isSyncing);

    const onRefresh = useCallback(() => {
        dispatch(triggerSync());
    }, [dispatch]);

    return {
        onRefresh,
        refreshing: isSyncing,
        isSyncing,
    };
}