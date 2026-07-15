import { useRevenueCat } from "@/src/components/AppDataProvider/RevenueCatProvider";
import PremiumPlusPage from "../../../src/components/subscriptions/PremiumPlusPage";
import PremiumPage from "../../../src/components/subscriptions/PremiumPage";
import SubScribePage from "../../../src/components/subscriptions/SubScribePage";

const Subscriptions = () => {
    const { hasPremium, hasPremiumPlus } = useRevenueCat();

    if (hasPremiumPlus) {
        return <PremiumPlusPage />;
    }

    if (hasPremium) {
        return <PremiumPage />;
    }

    return <SubScribePage />;
};

export default Subscriptions;