import React from 'react';
import { StyleSheet, Text, View, FlatList } from 'react-native';
import HTML from 'react-native-render-html';

import CONSTANT from './constant';

const MODE = 'TRANSIT';
const API_KEY = CONSTANT.API_KEY;

let source = 'Ayase, 3 Chome-1 Ayase, Adachi-ku, Tōkyō-to 120-0005, Japan',
    destination = '（株）ＢＪＩＴ, Japan, 〒105-0014 Tokyo, Minato, Shiba, 5 Chome−1−13';

export default class App extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            steps: [],
            addresses: [],
            totalDistance: null,
            totalDuration: null,
            hasError: false
        };
    }

    componentDidMount() {
        console.log(source, destination);
        this.getDirections(source, destination);
    }

    async getPlaceNameByCoordinates(coordinates) {
        try {
            let latlng = coordinates.lat + ',' + coordinates.lng,
                url,
                response,
                geocodeJSON;
                
            url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latlng}&key=${API_KEY}`;
            // console.log(`Geocode Url: ${url}`);
            response = await fetch(url);
            geocodeJSON = await response.json();
    
            // console.log('Geocode details: ', geocodeJSON);
    
            return geocodeJSON.results[0].formatted_address || '';
        } catch (error) {
            console.log(error);
            return ''; // pass an empty string while getting error
        }
    }
    
    processSteps(steps) {
        let index = 0,
            allSteps = [],
            promises = [];
    
        steps.forEach((step) => {
            let stepObj = {
                id: index++,
                distance: step.distance.text,
                duration: step.duration.text,
                htmlInstructions: step.html_instructions, // we have to format this property into a HTML format
                travelMode: step.travel_mode,
            };
    
            promises.push(this.getPlaceNameByCoordinates(step.start_location));
            
            allSteps.push(stepObj);
        });

        this.setState({ steps: allSteps });

        Promise.all(promises).then((addresses) => {
            // console.log('address: ', addresses);
            this.setState({ addresses });
        }, (error) => {
            console.log('promise error: ', error);
            this.setState({ hasError: true});
        });
    }
    
    processLegsInfo(legs) {
        let data = legs[0]; // don't have any other data
        this.state.totalDistance = data.distance.text;
        this.state.totalDuration = data.duration.text;
    
        this.processSteps(data.steps);
    }

    async getDirections(source, destination) {
        try {
            let url = `https://maps.googleapis.com/maps/api/directions/json?origin=${source}&destination=${destination}&mode=${MODE}&key=${API_KEY}`,
                response,
                responseJSON;
            
            // console.log(`Direction Url: ${url}`);
            response = await fetch(url);
            responseJSON = await response.json();
    
            this.processLegsInfo(responseJSON.routes[0].legs);
        } catch (error) {
            // console.log('Error: ', error);
            this.setState({ hasError: true});
        }
    }

    space(){
        return(
            <View
                style={{
                borderBottomColor: 'black',
                borderBottomWidth: 1,
                marginLeft: 5,
                marginRight: 5
                }}
          />
        )
    }

    renderElement() {
        if (this.state.steps.length === this.state.addresses.length) {
            return (
                <FlatList
                    data={this.state.steps}
                    ItemSeparatorComponent={this.space}
                    showsVerticalScrollIndicator={false}
                    renderItem={({item, index}) =>
                    <View style={styles.flatview}>
                        <Text style={styles.name}>{this.state.addresses[index]}</Text>
                        <HTML html={item.htmlInstructions} />
                        <Text style={styles.duration}>{item.duration}</Text>
                        <Text style={styles.travelmode}>{item.travelMode}</Text>
                    </View>
                    }
                    keyExtractor={item => item.id.toString()}
                />
            )
        }
    }

    render() {
        return (
        <View style={styles.container}>
            <Text style={styles.h2text}>Transit</Text>
            
            { this.state.addresses.length > 0 } && 
            (
                <Text style={styles.topInfo}>
                    <Text style={styles.totalDuration}>{this.state.totalDistance} </Text>
                    <Text style={styles.totalDistance}>({this.state.totalDuration})</Text>
                </Text>
                
                {this.renderElement()};
            )
        </View>
        );
    }
}

const styles = StyleSheet.create({
    container: {
      flex: 1,
      paddingTop: 30,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: '#F5FCFF',
    },
    h2text: {
      marginTop: 10,
      fontFamily: 'Helvetica',
      fontSize: 24,
      fontWeight: 'bold'
    },
    topInfo: {
        marginBottom: 20,
    },
    totalDuration: {
        color: '#f59330',
    },
    totalDistance: {
        color: '#757575',
    },
    flatview: {
      justifyContent: 'center',
      paddingTop: 20,
      borderRadius: 2,
      backgroundColor: '#e8e8e8',
      padding: 10,
    },
    name: {
      fontFamily: 'Verdana',
      fontSize: 18,
      color: '#555555',
      marginBottom: 5,
    },
    duration: {
      color: '#999999'
    },
    travelmode: {
      color: '#4b4b4b'
    }
    
  });