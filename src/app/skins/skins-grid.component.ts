import {Component, OnInit, ChangeDetectorRef, HostListener} from '@angular/core';
import {SkinShard} from '../models/SkinShard';
import {SkinShardService} from '../services/SkinShardService';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {DomSanitizer, SafeResourceUrl} from '@angular/platform-browser';


@Component({
  selector: 'app-skins-grid',
  imports: [CommonModule, FormsModule],
  templateUrl: './skins-grid.component.html',
  styleUrls: ['./skins-grid.component.css']
})
export class SkinsGridComponent implements OnInit {
  allSkins: SkinShard[] = [];
  loading = true;
  selectedImageUrl: string | null = null;
  isModalOpen = false;
  searchTerm: string = '';
  rarityFilter: string = '';
  rarities: string[] = ['All', 'ULTIMATE', 'EPIC', 'LEGENDARY', 'DEFAULT'];
  selectedSkin: SkinShard | null = null;
  youtubeUrl: SafeResourceUrl | null = null;
  selectedIndex: number = -1;
  hideOwned = false;



  constructor(private skinService: SkinShardService, private cdr: ChangeDetectorRef, private sanitizer: DomSanitizer) {
  }

  @HostListener('window:keydown', ['$event'])
  onKeyDown(e: KeyboardEvent): void {
    if (!this.isModalOpen) return;

    switch (e.key) {
      case 'ArrowLeft':
        e.preventDefault();
        this.prevSkin();
        break;
      case 'ArrowRight':
        e.preventDefault();
        this.nextSkin();
        break;
      case 'Escape':
        e.preventDefault();
        this.closeModal();
        break;
    }
  }

  ngOnInit(): void {
    this.skinService.getSkins().subscribe({
      next: (data) => {
        this.allSkins = Array.isArray(data) ? data.slice().filter(s => s.championName != 'Unknown') : [];
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error(err);
        this.loading = false;
        this.cdr.markForCheck();
      }
    });
  }

  private sortFn(a: SkinShard, b: SkinShard): number {
    if (a.wanted !== b.wanted) return a.wanted ? -1 : 1;
    return (a.championName || '').localeCompare(b.championName || '');
  }

  get filteredSkins(): SkinShard[] {
    let filtered = this.allSkins;

    if (this.searchTerm && this.searchTerm.trim() !== '') {
      const lower = this.searchTerm.toLowerCase().trim();
      filtered = filtered.filter(s =>
        (s.championName || '').toLowerCase().includes(lower)
        || (s.itemName || '').toLowerCase().includes(lower)
      );
    }

    if (this.rarityFilter) {
      const rarity = this.rarityFilter.toUpperCase();
      filtered = filtered.filter(s => (s.rarity || '').toUpperCase() === rarity);
    }

    if (this.hideOwned) {
      filtered = filtered.filter(s => !this.hasOwned(s));
    }

    return [...filtered].sort(this.sortFn.bind(this));
  }


  closeModal(): void {
    this.isModalOpen = false;
    this.selectedImageUrl = null;
  }

  hasOwned(s: SkinShard): boolean {
    return (s as any).ownsAnySKinForChampion ?? (s as any).ownsAnySkinForChampion ?? false;
  }

  toggleWanted(skin: SkinShard): void {
    const previous = skin.wanted;
    const nextVal = !previous;

    skin.wanted = nextVal;
    this.cdr.markForCheck();

    this.skinService.setWanted(skin.id, nextVal).subscribe({
      next: (updated) => {
        skin.wanted = updated.wanted;
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error(err);
        // Rollback
        skin.wanted = previous;
        this.cdr.markForCheck();
      }
    });
  }

  get totalWantedEssences(): number {
    return this.allSkins
      .filter(s => s.wanted)
      .reduce((sum, s) => sum + (s.upgradeEssenceValue || 0), 0);
  }

  private buildSkinSpotlightQuery(skin: SkinShard): string {
    const champ = (skin.championName || '').trim();
    let skinName = (skin.itemName || '').trim();

    // "Arcade Caitlyn" -> "Arcade"
    const lower = skinName.toLowerCase();
    const champLower = champ.toLowerCase();
    if (lower.includes(champLower)) {
      skinName = skinName.replace(new RegExp('\\b' + champ + '\\b', 'i'), '').replace(/\s+/g, ' ').trim();
    }

    const parts = [champ, skinName, 'SkinSpotlights'].filter(Boolean);
    return parts.join(' ').replace(/\s+/g, ' ').trim();
  }

  private buildChannelSearchUrl(skin: SkinShard): string {
    const q = encodeURIComponent(this.buildSkinSpotlightQuery(skin));
    return `https://www.youtube.com/@SkinSpotlights/search?query=${q}`;
  }

  openSpotlight(skin: SkinShard): void {
    const q = encodeURIComponent(this.buildSkinSpotlightQuery(skin));
    const url = `https://www.youtube.com/@SkinSpotlights/search?query=${q}`;
    window.open(url, '_blank');
  }

  playSpotlight(): void {
    if (!this.selectedSkin) return;
    const searchUrl = this.buildChannelSearchUrl(this.selectedSkin);
    window.open(searchUrl, '_blank');

    this.youtubeUrl = null;
  }

  get channelSearchHref(): string | null {
    if (!this.selectedSkin) return null;
    const champ = (this.selectedSkin.championName || '').trim();
    const item = (this.selectedSkin.itemName || '').trim();
    const q = encodeURIComponent(`${champ} ${item} SkinSpotlights`.replace(/\s+/g, ' ').trim());
    return `https://www.youtube.com/@SkinSpotlights/search?query=${q}`;
  }

  openModal(imageUrl: string, skin?: SkinShard): void {
    const fs = this.filteredSkins; // aktuelle Ansicht
    if (skin) {
      this.selectedIndex = fs.findIndex(s => s.id === skin.id);
      this.selectedSkin = skin;
    } else if (this.selectedIndex >= 0 && this.selectedIndex < fs.length) {
      this.selectedSkin = fs[this.selectedIndex];
    } else {
      this.selectedSkin = null;
      this.selectedIndex = -1;
    }
    this.selectedImageUrl = 'http://localhost:8080' + imageUrl;
    this.youtubeUrl = null;
    this.isModalOpen = true;
  }

  private updateModalFromIndex(): void {
    const fs = this.filteredSkins;
    if (this.selectedIndex < 0 || this.selectedIndex >= fs.length) return;
    const skin = fs[this.selectedIndex];
    this.selectedSkin = skin;
    this.selectedImageUrl = skin.imageUrl ? ('http://localhost:8080' + skin.imageUrl) : null;
    this.youtubeUrl = null; // Video zurücksetzen beim Wechsel
    this.cdr.markForCheck();
  }

  prevSkin(): void {
    const fs = this.filteredSkins;
    if (!fs.length) return;
    if (this.selectedIndex <= 0) {
      this.selectedIndex = fs.length - 1; // wrap-around
    } else {
      this.selectedIndex -= 1;
    }
    this.updateModalFromIndex();
  }

  nextSkin(): void {
    const fs = this.filteredSkins;
    if (!fs.length) return;
    if (this.selectedIndex >= fs.length - 1) {
      this.selectedIndex = 0; // wrap-around
    } else {
      this.selectedIndex += 1;
    }
    this.updateModalFromIndex();
  }
}
