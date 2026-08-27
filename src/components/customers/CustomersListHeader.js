import {
    StyleSheet,
    View,
} from "react-native";

import SortComponent from "../../../src/components/common/SortComponent";
import FilterComponent from "../../../src/components/common/FilterComponent";
import { StatCard } from "../../../src/components/common/StatCard";
import { useThemeStyles } from "../../../src/hooks/useThemeStyles";
import SearchInput from "../../../src/components/common/SearchInput";
import TimeNavigator from "../common/TimeNavigator";

export default function CustomersListHeader({
    customers,
    stats,
    sort,
    setSort,
    filter,
    setFilter,
    search,
    setSearch,
    timeState,
    setTimeState
}) {
    const { globalStyles } = useThemeStyles();

    /*
     * -----------------------------------------
     * FILTER OPTIONS
     * -----------------------------------------
     */

    const filterOptions = [
        {
            label: "All",
            key: "all",
            action: () => setFilter("all"),
        },
        {
            label: "With Balance",
            key: "with_balance",
            action: () => setFilter("with_balance"),
        },
        {
            label: "No Balance",
            key: "no_balance",
            action: () => setFilter("no_balance"),
        },
    ];

    /*
     * -----------------------------------------
     * SORT OPTIONS
     * -----------------------------------------
     */

    const sortOptions = [
        {
            label: "Name A-Z",
            key: "name_asc",
            action: () => setSort("name_asc"),
        },
        {
            label: "Name Z-A",
            key: "name_desc",
            action: () => setSort("name_desc"),
        },
        {
            label: "Newest",
            key: "newest",
            action: () => setSort("newest"),
        },
        {
            label: "Oldest",
            key: "oldest",
            action: () => setSort("oldest"),
        },
        {
            label: "Highest Revenue",
            key: "high_revenue",
            action: () => setSort("high_revenue"),
        },
        {
            label: "Highest Balance",
            key: "high_balance",
            action: () => setSort("high_balance"),
        },
    ];

    return (
        <>
            
            <TimeNavigator
                state={timeState}
                onChange={setTimeState}
            />
            <SearchInput
                search={search}
                setSearch={setSearch}
                placeholder="Search customers..."
            />

            <View style={globalStyles.filterSortContainer}>
                <FilterComponent
                    filterOptions={filterOptions}
                    activeFilter={filter}
                />

                <SortComponent
                    sortOptions={sortOptions}
                    activeSort={sort}
                />
            </View>

            {customers.length > 0 && (
                <View style={styles.statsRow}>
                    <StatCard
                        label="Customers"
                        value={stats?.count?.toLocaleString() || "0"}
                        subText=""
                    />

                    <StatCard
                        label="Outstanding"
                        value={stats?.outstanding?.toLocaleString() || "0"}
                        subText=""
                    />
                </View>
            )}
        </>
    );
}

const styles = StyleSheet.create({
    statsRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        gap: 10,
    },
});