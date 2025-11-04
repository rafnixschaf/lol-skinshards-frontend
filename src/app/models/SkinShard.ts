
export interface SkinShard {
  id: number;
  championName: string;
  itemName: string;
  rarity: string;
  disenchantValue: number | null;
  upgradeEssenceValue: number | null;
  value: number | null;
  wanted: boolean;
  imageUrl?: string;
  ownsAnySKinForChampion: boolean;
  sell: boolean;
  reroll: boolean;
  asset: string;
  count: number;
}
