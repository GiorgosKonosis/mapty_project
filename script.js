'use strict';

const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
let inputType = document.querySelector('.form__input--type');
let inputDistance = document.querySelector('.form__input--distance');
let inputDuration = document.querySelector('.form__input--duration');
let inputCadence = document.querySelector('.form__input--cadence');
let inputElevation = document.querySelector('.form__input--elevation');

class App {
  #map;
  #mapEvent;
  workouts = [];
  workout;

  constructor() {
    this._getPosition();

    this._localStorageGet();

    form.addEventListener('submit', this._newWorkout.bind(this));
    inputType.addEventListener('change', this._toggleElevationField);
    containerWorkouts.addEventListener('click', this._moveToPopup.bind(this));
  }

  isNumber(...num) {
    return num.every(num => Number.isFinite(num));
  }

  isPositive(...num) {
    return num.every(num => num > 0);
  }

  _getPosition() {
    if (navigator.geolocation)
      navigator.geolocation.getCurrentPosition(
        this._loadMap.bind(this),
        function () {
          alert('Sorry we could not retrieve your location');
        }
      );
  }

  _loadMap(position) {
    const { latitude, longitude } = position.coords;
    const coords = [latitude, longitude];
    this.#map = L.map('map').setView(coords, 13);

    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#map);

    this.#map.on('click', this._showForm.bind(this));
  }

  _showForm(mapE) {
    this.#mapEvent = mapE;
    form.classList.remove('hidden');
    inputDistance.focus();
  }

  _hideform() {
    inputCadence.value =
      inputDistance.value =
      inputDuration.value =
      inputElevation.value =
        '';

    form.classList.toggle('hidden');
    // form.classList.toggle('form--transition');
  }

  _newWorkout(e) {
    e.preventDefault();
    const type = inputType.value;
    const { lat, lng } = this.#mapEvent.latlng;
    let workout;

    if (type === 'running') {
      if (
        !this.isNumber(
          +inputCadence.value,
          +inputDistance.value,
          +inputDuration.value
        )
      )
        return alert('Fields should only have numbers as inputs');

      if (
        !this.isPositive(
          +inputCadence.value,
          +inputDistance.value,
          +inputDuration.value
        )
      )
        return alert('Fields should only have positive numbers as inputs');

      workout = new Running(
        +inputDistance.value,
        +inputDuration.value,
        [lat, lng],
        +inputCadence.value
      );
    }

    if (type === 'cycling') {
      if (
        !this.isNumber(
          +inputElevation.value,
          +inputDistance.value,
          +inputDuration.value
        )
      )
        return alert('Fields should only have numbers as inputs');

      if (
        !this.isPositive(
          +inputElevation.value,
          +inputDistance.value,
          +inputDuration.value
        )
      )
        return alert('Fields should only have positive numbers as inputs');

      workout = new Cycling(
        +inputDistance.value,
        +inputDuration.value,
        [lat, lng],
        +inputElevation.value
      );
    }
    this.workouts.push(workout);
    this._renderWorkoutMarker(workout);
    this._newWorkoutForm(workout);
    this._hideform();
    this._localStorage();
  }

  _renderWorkoutMarker(workout) {
    L.marker(workout.coords)
      .addTo(this.#map)
      .bindPopup({
        maxWidth: 250,
        minWidth: 100,
        autoClose: false,
        closeOnClick: false,
        className: `${workout.type}-popup`,
      })
      .setPopupContent(`${workout.description}`)
      .openPopup();
  }

  _toggleElevationField() {
    inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
    inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
  }

  _newWorkoutForm(workout) {
    let html = ` <li class="workout workout--${workout.type}" data-id="${
      workout.id
    }">
    <h2 class="workout__title">${workout.description}</h2>
    <div class="workout__details">
      <span class="workout__icon">${
        workout.type === 'running' ? '🏃‍♂️' : '🚴'
      }</span>
      <span class="workout__value">${workout.distance}</span>
      <span class="workout__unit">km</span>
    </div>
    <div class="workout__details">
      <span class="workout__icon">⏱</span>
      <span class="workout__value">${workout.duration}</span>
      <span class="workout__unit">min</span>
    </div>`;

    if (workout.type === 'running') {
      html += `<div class="workout__details">
      <span class="workout__icon">⚡️</span>
      <span class="workout__value">${workout.pace.toFixed(1)}</span>
      <span class="workout__unit">min/km</span>
            </div>
      <div class="workout__details">
      <span class="workout__icon">🦶🏼</span>
      <span class="workout__value">${workout.cadence}</span>
      <span class="workout__unit">spm</span>
      </div>
    </li>`;
    }

    if (workout.type === 'cycling') {
      html += ` <div class="workout__details">
        <span class="workout__icon">⚡️</span>
        <span class="workout__value">${workout.speed.toFixed(1)}</span>
        <span class="workout__unit">km/h</span>
        </div>
        <div class="workout__details">
        <span class="workout__icon">⛰</span>
        <span class="workout__value">${workout.elevation}</span>
        <span class="workout__unit">m</span>
        </div>
    </li>`;
    }
    form.insertAdjacentHTML('afterend', html);
  }

  _moveToPopup(e) {
    const workoutId = e.target.closest('.workout');

    if (!workoutId) return;

    const workoutids = this.workouts.find(el => el.id === workoutId.dataset.id);

    this.#map.setView(workoutids.coords, 13, {
      animate: true,
      pan: {
        duration: 1,
      },
    });

    workoutids.clicks();
  }

  _localStorage() {
    localStorage.setItem('workouts', JSON.stringify(this.workouts));
  }

  _localStorageGet() {
    const work = JSON.parse(localStorage.getItem('workouts'));

    this.workouts = work;

    if (!work) return;

    this.workouts.forEach(work => this._newWorkoutForm(work));
  }
}

class Workout {
  date = new Date();
  id = (Date.now() + '').slice(-10);
  click = 0;

  constructor(distance, duration, coords) {
    this.distance = distance;
    this.duration = duration;
    this.coords = coords;
  }

  clicks() {
    this.click++;
  }
  setDescription() {
    // prettier-ignore
    const months =[
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December',
    ];
    this.description = `${this.type[0].toUpperCase()}${this.type.slice(
      1
    )}  on ${months[this.date.getMonth()]} ${this.date.getDate()}`;
  }
}

class Running extends Workout {
  type = 'running';

  constructor(distance, duration, coords, cadence) {
    super(distance, duration, coords);
    this.cadence = cadence;
    this.calcPace();
    this.setDescription();
  }

  calcPace() {
    this.pace = this.distance / (this.duration / 60);
  }
}

class Cycling extends Workout {
  type = 'cycling';

  constructor(distance, duration, coords, elevation) {
    super(distance, duration, coords);
    this.elevation = elevation;
    this.calcSpeed();
    this.setDescription();
  }

  calcSpeed() {
    this.speed = this.elevation / (this.duration / 60);
  }
}

const app = new App();
