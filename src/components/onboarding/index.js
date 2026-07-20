import AddProduct from "./addProduct";

export default function OnBoarding({type}) {
    if(type === "add_product") return <AddProduct />
}