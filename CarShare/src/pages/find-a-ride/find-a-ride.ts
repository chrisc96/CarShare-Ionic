import { Component } from "@angular/core";
import { IonicPage, NavController, NavParams, MenuController, Refresher } from "ionic-angular";
import { RideListingPage } from "../ride-listing/ride-listing";
import { NavigationMenuProvider } from "../../providers/navigation-menu/navigation-menu";
import 'rxjs/add/operator/map'
import { Listing } from '../struct/listing'
import { FirestoreListingsProvider } from "../../providers/firestore-listings/firestore-listings";
import { Observable } from 'rxjs/Observable';
import { Subscription } from "rxjs";
import { PostARidePage } from "../post-a-ride/post-a-ride";

/**
 * Generated class for the FindARidePage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@IonicPage()
@Component({
  selector: "page-find-a-ride",
  templateUrl: "find-a-ride.html"
})
export class FindARidePage {

  listings: Listing[];
  listingCount: number = 0;
  listingSubscription: Subscription

  constructor(
    public navCtrl: NavController,
    public navParams: NavParams,
    public menuCtrl: MenuController,
    public navMenu: NavigationMenuProvider,
    public listingsProvider: FirestoreListingsProvider
  ) {
  }

  ngOnInit() {
    this.listingSubscription = this.listingsProvider.getAllListingsObservable().subscribe(listings => {
      this.listings = listings;
      this.listingCount = this.listings.length;
    });
  }

  goToListing(listingIdx) {
    this.navCtrl.push(RideListingPage, {'listing': this.listings[listingIdx]});
  }
 
  ionViewWillEnter() {
    this.menuCtrl.enable(true, 'navMenu');
    this.navMenu.setActivePage(FindARidePage)
  }

  ngOnDestroy() {
    this.listingSubscription.unsubscribe()
  }

  userHasListings() {
    return this.listingCount !== 0
  }

  goToPostARide() {
    this.navCtrl.push(PostARidePage);
  }

  doRefresh(refresher) {
    console.log('Begin async operation', refresher);

    setTimeout(() => {
      console.log('Async operation has ended');
      refresher.complete();
    }, 2000);
  }

  doPulling(refresher: Refresher) {}
}