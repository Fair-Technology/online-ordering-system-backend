import { ShopUsage } from '../../../domain/usage/ShopUsage';

export interface ReconcileShopUsageResultDto {
  usage: ShopUsage;
  reconciledCount: number;
}
