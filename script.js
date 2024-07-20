'use strict';

// prettier-ignore
const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
let inputType = document.querySelector('.form__input--type');
let inputDistance = document.querySelector('.form__input--distance');
let inputDuration = document.querySelector('.form__input--duration');
let inputCadence = document.querySelector('.form__input--cadence');
let inputElevation = document.querySelector('.form__input--elevation');

let mapEvent;
let map;

class CyclingCl {
  constructor(type, distance, duration) {
    this.type = type;
    this.distance = distance;
    this.duration = duration;
  }
}
if (navigator.geolocation)
  navigator.geolocation.getCurrentPosition(
    function (e) {
      const { latitude, longitude } = e.coords;
      const coords = [latitude, longitude];
      map = L.map('map').setView(coords, 13);

      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(map);

      map.on('click', function (mapE) {
        form.classList.remove('hidden');
        inputDistance.focus();
        mapEvent = mapE;
      });
    },
    function () {
      alert('Sorry we could not retrieve your location');
    }
  );

form.addEventListener('submit', function (e) {
  e.preventDefault();

  console.log(mapEvent);
  const { lat, lng } = mapEvent.latlng;
  const clickCoords = [lat, lng];

  L.marker(clickCoords)
    .addTo(map)
    .bindPopup({
      maxWidth: 250,
      minWidth: 100,
      autoClose: false,
      closeOnClick: false,
      className: 'running-popup',
    })
    .setPopupContent('Workout')
    .openPopup();

  inputCadence =
    inputDistance.value =
    inputDuration.value =
    inputElevation.value =
      '';
});
inputType.addEventListener('change', function (e) {
  inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
  inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
});
