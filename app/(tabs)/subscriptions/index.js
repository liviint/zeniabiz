import { useSubscription } from "../../../src/components/AppDataProvider/PremiumSubscriptionsProvider";
import PremiumPlusPage from "../../../src/components/subscriptions/PremiumPlusPage";
import PremiumPage from "../../../src/components/subscriptions/PremiumPage";
import SubScribePage from "../../../src/components/subscriptions/SubScribePage";
import { AnalyticsService } from "../../../src/utils/analyticsService";

const Subscriptions = () => {
    const {
        hasPremium,
        hasPremiumPlus,
        loading
    } = useSubscription();

    AnalyticsService.logFirstEvent('first_subscription_page_viewed');

    if (loading) {
        return null;
    }

    if (hasPremiumPlus) {
        return <PremiumPlusPage />;
    }

    if (hasPremium) {
        return <PremiumPage />;
    }

    return <SubScribePage />;
};

export default Subscriptions;