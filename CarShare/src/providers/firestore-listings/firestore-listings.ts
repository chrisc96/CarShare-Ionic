// GENERAL
import { Injectable } from '@angular/core';

// FIREBASE
import { AngularFirestore } from 'angularfire2/firestore';
import * as firebase from 'firebase';

// STRUCTS
import { Listing } from '../../pages/struct/listing';

// PROVIDERS
import { FirestoreUsersProvider } from '../../providers/firestore-users/firestore-users'

// RXJS
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/toPromise';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/switchMap';
import 'rxjs/add/operator/first';
import 'rxjs/add/operator/mergeMap';
import { combineLatest } from 'rxjs';
import { of } from 'rxjs';

/*
  Generated class for the FirestoreListingsProvider provider.

  See https://angular.io/guide/dependency-injection for more info on providers
  and Angular DI.
*/
@Injectable()
export class FirestoreListingsProvider {

  allListingsObservable: Observable<Listing[]>;
  userListingsObservable: Observable<Listing[]>;
  ridesUserTakingObservable: Observable<Listing[]>;
  

  constructor(public afs: AngularFirestore, public usersProvider: FirestoreUsersProvider) {

    this.allListingsObservable = this.afs.collection('listings').snapshotChanges().map(listings => {
      if (listings) {
        return listings.map(changeAction => {
          const listing = changeAction.payload.doc.data() as Listing;
  
          const carID = listing.carDocumentID;
          const userID = listing.userDocumentID;
          listing.id = changeAction.payload.doc.id;
          
          return combineLatest(this.afs.doc('cars/' + carID).valueChanges(), this.afs.doc('users/' + userID).valueChanges(), (data1, data2) => {
            return { ...listing, ...data1, ...data2 };
          })
        })
      }
    }).mergeMap(observables => combineLatest(observables))

    this.userListingsObservable = this.usersProvider.getUserObservable().flatMap(user => {
      if (user) {
        return this.afs.collection('listings', ref => ref.where('userDocumentID', '==', user.uid)).snapshotChanges().map(listings => {
            return listings.map(changeAction => {
              
              const listing = changeAction.payload.doc.data() as Listing;

              const carID = listing.carDocumentID;
              listing.id = changeAction.payload.doc.id;
  
              return combineLatest(this.afs.doc('cars/' + carID).valueChanges(), (data1) => {
                return { ...listing, ...data1 };
              })
            })
        }).mergeMap(observables => combineLatest(observables))
      }
    });

    this.ridesUserTakingObservable = this.afs.collection('listings').valueChanges().map(listings => {
      if (listings) {
        return listings.filter(changeAction => {
          const listing = changeAction as Listing;
          const userPoster = listing.userDocumentID;

          let iDidntPostThisListing = true;
          let comingOnThisListing = false;
          listing.whosComing.forEach(el => {
            if (userPoster === el.uid) {
              iDidntPostThisListing = false;
              return;
            }

            // 
            if (el.uid === this.usersProvider.getUser().uid) {
              comingOnThisListing = true;
              return;
            }
          })

          return comingOnThisListing && iDidntPostThisListing
        }).map(changeAction => {
          const listing = changeAction as Listing;
          const userPoster = listing.userDocumentID;
          const carID = listing.carDocumentID;
          listing.id = listing.id;
        
          return combineLatest(this.afs.doc('cars/' + carID).valueChanges(), this.afs.doc('users/' + userPoster).valueChanges(), (data1, data2) => {
            return { ...listing, ...data1, ...data2 };
          })
        })
      }
    }).mergeMap(observables => combineLatest(observables))
  }

  public createListing = (car, departDate, departTime, noSeats, storageAvail, from, to): Promise<firebase.firestore.DocumentReference> => {
    return this.usersProvider.getUserObservable().first().toPromise().then(user => {
      let uid = user.uid;
      let carDocID = car.docID;
      return this.afs.collection('listings').add({
        timeCreated: firebase.firestore.FieldValue.serverTimestamp(),
        meetingPoint: from,
        destination: to,
        userDocumentID: uid,
        carDocumentID: carDocID,
        departureDate: departDate,
        departureTime: departTime,
        seatsAvailable: noSeats,
        storageSpace: storageAvail,
        whoWantsToCome: [],
        whosComing: []
      })
    })
  }

  public addRequest(listing) {
    return this.afs.doc<Listing>('listings/' + listing.id).update({
      whoWantsToCome: listing.whoWantsToCome
    })
  }

  public updateListing(listing) {
    return this.afs.doc<Listing>('listings/' + listing.id).update({
      carDocumentID: listing.carDocumentID,
      departureDate: listing.departureDate,
      departureTime: listing.departureTime,
      destination: listing.destination,
      meetingPoint: listing.meetingPoint,
      seatsAvailable: listing.seatsAvailable,
      storageSpace: listing.storageSpace,
      userDocumentID: listing.userDocumentID,
      whoWantsToCome: listing.whoWantsToCome,
      whosComing: listing.whosComing
    })
  }

  public deleteListing(listing) {
    return this.afs.doc<Listing>('listings/' + listing.id).delete()
  }

  public getUserListingsObservable() {
    return this.userListingsObservable;
  }

  public getAllListingsObservable() {
    return this.allListingsObservable;
  }

  public getRidesUserIsTakingObservable() {
    return this.ridesUserTakingObservable;
  }
}
