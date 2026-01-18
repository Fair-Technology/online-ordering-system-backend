import { ShopHours } from './shop.entity';

export interface ShopHoursPayload {
  shopId: string;
  timezone: string;
  weekly?: ShopHours['weekly'];
}
