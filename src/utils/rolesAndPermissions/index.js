import { getActiveContextSync } from "../../db/utils";

export function getCompanyRole() {
    let ctx = getActiveContextSync()
    if(!ctx.is_authenticated && !ctx.company_role) return "owner"
    else return ctx.company_role;
}

export function isLoggedIn() {
    let ctx = getActiveContextSync()
    return ctx.is_authenticated
}

export function isOwner() {
    return getCompanyRole() === "owner";
}

export function isManager() {
    return getCompanyRole() === "manager";
}

export function isStaff() {
    return getCompanyRole() === "staff";
}

export function isOwnerOrManager() {
    return ["owner", "manager"].includes(
        getCompanyRole()
    );
}

/*
|--------------------------------------------------------------------------
| Permission Helpers
|--------------------------------------------------------------------------
*/

export function canManageBusiness() {
    return isOwner();
}


export function canViewReports() {
    return isOwnerOrManager();
}

export function canManageInventory() {
    return ["owner", "manager", "staff"].includes(
        getCompanyRole()
    );
}

export function canCreateProducts() {
    return ["owner", "manager", "staff"].includes(
        getCompanyRole()
    );
}

export function canCreateServices() {
    return ["owner", "manager", "staff"].includes(
        getCompanyRole()
    );
}

export function canCreateCustomers() {
    return ["owner", "manager", "staff"].includes(
        getCompanyRole()
    );
}

export function canCreateSales() {
    return ["owner", "manager", "staff"].includes(
        getCompanyRole()
    );
}

export function canRecordPayments() {
    return ["owner", "manager", "staff"].includes(
        getCompanyRole()
    );
}