import React from 'react';
import { View, Image } from 'react-native';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';

import CONSTANT from './constant';

const GooglePlacesInput = (props) => {
  return (
    <GooglePlacesAutocomplete
      placeholder={props.placeholder}
      minLength={2} // minimum length of text to search
      autoFocus={false}
      fetchDetails={true}
      onPress={(data, details = null) => { // 'details' is provided when fetchDetails = true
        console.log(data, details);
      }}

      textInputProps={{
        onChangeText: (text) => { console.log('text: ', text) }
      }}
      
      getDefaultValue={() => ''}
      
      query={{
        // available options: https://developers.google.com/places/web-service/autocomplete
        key: CONSTANT.API_KEY,
        language: 'en', // language of the results
        types: '(cities)' // default: 'geocode'
      }}
      
      styles={{
        textInputContainer: {
          width: '100%'
        },
        description: {
          fontWeight: 'bold'
        },
        predefinedPlacesDescription: {
          //color: '#1faadb'
        }
      }}
      
      currentLocation={false} // Will add a 'Current location' button at the top of the predefined places list

      filterReverseGeocodingByTypes={['locality', 'administrative_area_level_3']} // filter the reverse geocoding results by types - ['locality', 'administrative_area_level_3'] if you want to display only cities

      debounce={200} // debounce the requests in ms. Set to 0 to remove debounce. By default 0ms.
      
    />
  );
}

export default GooglePlacesInput;