import { useRevenueCat } from "@/src/components/AppDataProvider/RevenueCatProvider";
import PremiumPlusPage from "../../../src/components/subscriptions/PremiumPlusPage";
import PremiumPage from "../../../src/components/subscriptions/PremiumPage";
import SubScribePage from "../../../src/components/subscriptions/SubScribePage";
import { AnalyticsService } from "../../../src/utils/analyticsService";

const Subscriptions = () => {
    const { hasPremium, hasPremiumPlus } = useRevenueCat();
    AnalyticsService.logFirstEvent('first_subscription_page_viewed');

    if (hasPremiumPlus) {
        return <PremiumPlusPage />;
    }

    if (hasPremium) {
        return <PremiumPage />;
    }

    return <SubScribePage />;
};

export default Subscriptions;