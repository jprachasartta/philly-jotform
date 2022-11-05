// api key to access JotForm, switch my key for yours
JF.initialize({ apiKey: "c1d56289ede5a56a135167c8c092d98e" });
var apiKey = JF.getAPIKey();
 
// get form submissions from JotForm Format: (formID, callback)
JF.getFormSubmissions("223075945414053", function (response) {
    // array to store all the submissions: we will use this to create the map
  const submissions = [];
  // for each response
  for (var i = 0; i < response.length; i++) {
    // create an object to store the submissions and structure as a json
    const submissionProps = {};
 
    // add all fields of response.answers to our object
    const keys = Object.keys(response[i].answers);
    keys.forEach((answer) => {
      const lookup = response[i].answers[answer].cfname ? "cfname" : "name";
      submissionProps[response[i].answers[answer][lookup]] =
        response[i].answers[answer].answer;
    });
 
    // convert location coordinates string to float array
    submissionProps["Location Coordinates"] = submissionProps[
      "Location Coordinates"
    ]
      .split(/\r?\n/)
      .map((X) => parseFloat(X.replace(/[^\d.-]/g, "")));
 
    // add submission to submissions array
    submissions.push(submissionProps);
  }
 
  const deckgl = new deck.DeckGL({
    container: "map",
    // Set your Mapbox access token here
    mapboxApiAccessToken:
      "pk.eyJ1IjoianByYWMiLCJhIjoiY2t2aXRzOGx6Y3BldzJvbW50NGxyMDUwbSJ9.xPknrw_XSeNgZ5w7SxkOIg",
    // Set your Mapbox style here
    mapStyle: "mapbox://styles/jprac/cl2jlffag002214oy16fnkwlk",
    initialViewState: {
      latitude: 42.36476,
      longitude: -71.10326,
      zoom: 12,
      bearing: 0,
      pitch: 0,
    },
    touchRotate: true,
    controller: true,
    layers: [
      new deck.ScatterplotLayer({
        id: "form-submissions", // layer id
        data: submissions, // data formatted as array of objects
        getPosition: (d) => {
          console.log(d["Location Coordinates"]);
          return d["Location Coordinates"];
        },
        // Styles
        radiusUnits: "pixels",
        getRadius: 10,
        opacity: 0.7,
        stroked: false,
        filled: true,
        radiusScale: 3,
        getFillColor: [255, 0, 0],
        pickable: true,
        autoHighlight: true,
        highlightColor: [255, 255, 255, 255],
        parameters: {
          depthTest: false,
        },
        // Need to add a new input parameter to the function for the text
       onClick: (info) => {
        getImageGallery(
          info.object.fileUpload,
          info.object.describeWhat,
          (preview = false)
        ); 
          flyToClick(info.object["Location Coordinates"]);
        },
      }),
    ],
    getTooltip: ({ object }) => {
      if (object) {
        return (
          object && {
           html: getImageGallery(
              object.fileUpload,
              object.describeWhat,
              (preview = true)
            ),
            style: {
              width: "fit-content",
              backgroundColor: "transparent",
              overflow: "hidden",
            },
          }
        );
      }
    },
  });

 
  function getImageGallery(images, text, preview = false) {
    //added a new text input to the getImageGallery function
    if (!images && preview) {
      // return you are here text
      return `<p id="current-location-text">You are here</p>`;
    }
 
    const imageGallery = document.createElement("div");
    imageGallery.id = !preview ? "image-gallery" : "";
 
    for (var i = 0; i < images.length; i++) {
      const image = document.createElement("img");
      image.src = images[i];
 
 
      // set max width to image
      image.style.maxWidth = preview ? "350px" : "";

      if (!preview || i === 0) {
        imageGallery.appendChild(image);
      }
    }

    // add text to image gallery
    const textDiv = document.createElement("div");
    textDiv.id = "image-gallery-text";
    textDiv.innerHTML = text;
 
    // add fixed styling if in modal view
    if (!preview) {
      textDiv.style.position = "fixed";
      textDiv.style.top = "0";
      textDiv.style.left = "0";
      textDiv.style.right = "0";
      textDiv.style.borderRadius = "0";
      textDiv.style.padding = "2rem";
    }
    imageGallery.appendChild(textDiv);



 
    // for closing the image gallery (only for click)
    if (!preview) {
      imageGallery.addEventListener("click", function () {
        imageGallery.remove();
      });
      // append the image gallery to the body
      document.body.appendChild(imageGallery);
    } else {
      return imageGallery.outerHTML;
    }
  }
  function flyToClick(coords) {
    deckgl.setProps({
      initialViewState: {
        longitude: coords[0],
        latitude: coords[1],
        zoom: 17,
        bearing: 20,
        pitch: 20,
        transitionDuration: 750,
        transitionInterpolator: new deck.FlyToInterpolator(),
      },
    });
  }
  const ICON_MAPPING = {
    marker: { x: 0, y: 0, width: 128, height: 128, mask: true },
  };
 
  // get current location callback (which means it is called upon asynchronously)
  const successCallback = (position) => {
    // add new point layer of current location to deck gl
    const layer = new deck.IconLayer({
      id: "location",
      data: [
        {
          position: [position.coords.longitude, position.coords.latitude],
        },
      ],
      pickable: true,
      iconAtlas:
        "https://raw.githubusercontent.com/visgl/deck.gl-data/master/website/icon-atlas.png",
      iconMapping: ICON_MAPPING,
      getIcon: (d) => "marker",
      sizeScale: 15,
      getPosition: (d) => d.position,
      getSize: 10,
      getColor: [255, 255, 255],
    });
 
    deckgl.setProps({
      layers: [...deckgl.props.layers, layer],
    });
  };
 
  const errorCallback = (error) => {
    console.log(error);
  };
 
 // define the function that asks for their location and callback if permitted or rejected their permissions
  function getCurrentLocation() {
    const currentLocation = navigator.geolocation.getCurrentPosition(
      successCallback,
      errorCallback
    );
    return currentLocation;
  }
 
 // Option A: Call the function to ask for permissions and get location on first load (default)
  if (navigator.geolocation) {
    getCurrentLocation();
  }
 
 // Option 2: Call the function to ask for permissions and get location on click of “Where am I?” (backup)
  const locationButton = document.createElement("div");
  // create a button that will request the users location
  locationButton.textContent = "Where am I?";
  locationButton.id = "location-button";
  locationButton.addEventListener("click", () => {
    // when clicked, get the users location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        const { latitude, longitude } = position.coords;
        // create a deck gl layer for the users location
        const layer = new deck.IconLayer({
          id: "location",
          data: [{ longitude, latitude }],
          pickable: true,
          iconAtlas: "https://raw.githubusercontent.com/visgl/deck.gl-data/master/website/icon-atlas.png",
          iconMapping: ICON_MAPPING,
          getIcon: (d) => "marker",
          sizeScale: 15,
          getPosition: (d) => [d.longitude, d.latitude],
          getSize: 10,
          getColor: [255, 255, 255],
        });
        const keepLayers = deckgl.props.layers[0];
 
        deckgl.setProps({
          layers: [keepLayers, layer],
        });
 
        flyToClick([longitude, latitude]);
      });
    }
  });
  // append the button
  document.body.appendChild(locationButton);
});
