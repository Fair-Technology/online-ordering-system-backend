import { ShopSubscription } from '../../../domain/subscription/ShopSubscription';
import { subscriptionContainer } from '../cosmosClient';

export async function findSubscriptionByShopId(shopId: string): Promise<ShopSubscription | null> {
  try {
    const { resource } = await subscriptionContainer.item(shopId, shopId).read<ShopSubscription>();
    return resource || null;
  } catch (error: any) {
    if (error.code === 404) return null;
    throw error;
  }
}

export async function upsertSubscription(subscription: ShopSubscription): Promise<ShopSubscription> {
  try {
    const { resource } = await subscriptionContainer.items.upsert<ShopSubscription>(subscription);
    return resource!;
  } catch (error) {
    throw error;
  }
}

export async function findSubscriptionByBillingSubscriptionId(billingSubscriptionId: string): Promise<ShopSubscription | null> {
  try {
    const querySpec = {
      query: 'SELECT * FROM c WHERE c.billingSubscriptionId = @billingSubscriptionId',
      parameters: [{ name: '@billingSubscriptionId', value: billingSubscriptionId }],
    };
    const { resources } = await subscriptionContainer.items.query<ShopSubscription>(querySpec).fetchAll();
    return resources && resources.length > 0 ? resources[0] : null;
  } catch (error) {
    throw error;
  }
}
