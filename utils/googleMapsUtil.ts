// import googleMaps from "@google/maps";
// import "dotenv/config";

// // Direct access to the google maps nodejs client
// const client = googleMaps.createClient({
//     // key: process.env.GOOGLE_MAPS_API_KEY!,
//     key: "AIzaSyALz_FbYsTMwluOA5jDCEI6KUUAcsC9tVo",
//     Promise: Promise
// });

// interface AddressComponent {
//     types: string[],
//     long_name: string
// }

// interface Address {
//     address_components: AddressComponent[]
// }

// interface SameStateResult {
//     areInSameState: boolean
// }

// interface SameLocalGovernmentResult {
//     areSameLocalGovernment: boolean
// }

// interface DistanceResult {
//     distance: number
// }

// interface ETAResult {
//     ETA: number
// }

// // Converts the given laitude and longitude to a human-readable address
// export const getAddress = async (latitude: number, longitude: number): Promise<Address> => {
//     const response = await client.reverseGeocode({ latlng: { lat: latitude, lng: longitude } }).asPromise();
//     return response.json.results[0]!;
// }

// // Check if 2 coordinates are in the same state
// export const areInSameState = async (latitude1: number, longitude1: number, latitude2: number, longitude2: number): Promise<SameStateResult> => {
//     const [address1, address2] = await Promise.all([
//         getAddress(latitude1, longitude1),
//         getAddress(latitude2, longitude2)
//     ]);

//     const state1 = address1.address_components.find(component => component.types.includes('administrative_area_level_1'))?.long_name;
//     const state2 = address2.address_components.find(component => component.types.includes('administrative_area_level_1'))?.long_name;

//     return { areInSameState: state1 === state2 };
// }


// // Check if 2 coordinates are in the same L.G.A
// export const areSameLocalGovernment = async (latitude1: number, longitude1: number, latitude2: number, longitude2: number): Promise<SameLocalGovernmentResult> => {
//     const [address1, address2] = await Promise.all([
//         getAddress(latitude1, longitude1),
//         getAddress(latitude2, longitude2)
//     ]);

//     const local_gov1 = address1.address_components.find(component => component.types.includes('locality') || component.types.includes('administrative_area_level_2'))?.long_name;
//     const local_gov2 = address2.address_components.find(component => component.types.includes('locality') || component.types.includes('administrative_area_level_2'))?.long_name;

//     return { areSameLocalGovernment: local_gov1 === local_gov2 };
// }

// // Calculate the distance between 2 coordinates
// export const calculateDistanceInMeters = async (latitude1: number, longitude1: number, latitude2: number, longitude2: number): Promise<DistanceResult> => {
//     const response = await client.directions({
//         origin: { lat: latitude1, lng: longitude1 },
//         destination: { lat: latitude2, lng: longitude2 },
//         mode: 'driving'
//     }).asPromise();

//     const distance = response.json.routes[0]!.legs[0]!.distance.value; // distance in metres. Convert to km by doing DISTANCE * 1000.

//     return { distance };
// }

// export const calculateETAInMinutes = async (latitude1: number, longitude1: number, latitude2: number, longitude2: number): Promise<ETAResult> => {
//     const response = await client.directions({
//         origin: { lat: latitude1, lng: longitude1 },
//         destination: { lat: latitude2, lng: longitude2 },
//         mode: 'driving'
//     }).asPromise();

//     const duration = response.json.routes[0]!.legs[0]!.duration.value;
//     const minutes = Math.round(duration / 60);

//     return { ETA: minutes };
// }

// const googleMapsUtil = {
//     client,
//     areSameLocalGovernment,
//     areInSameState,
//     getAddress,
//     calculateDistanceInMeters,
//     calculateETAInMinutes
// };

// export default googleMapsUtil;