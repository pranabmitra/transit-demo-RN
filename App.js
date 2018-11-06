import React from 'react';
import { StyleSheet, Text, View, FlatList } from 'react-native';
import HTML from 'react-native-render-html';

const MODE = 'TRANSIT';
const API_KEY = 'AIzaSyD8_ppn0R1Pd5HsDmTcuFsbolKPSWwg-1g';

let source = 'Ayase, 3 Chome-1 Ayase, Adachi-ku, Tōkyō-to 120-0005, Japan',
    destination = '（株）ＢＪＩＴ, Japan, 〒105-0014 Tokyo, Minato, Shiba, 5 Chome−1−13',
    output = {};

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

        output.steps = [];
    
        steps.forEach((step) => {
            // console.log(step);
            let stepObj = {
                distance: step.distance.text,
                duration: step.duration.text,
                htmlInstructions: step.html_instructions, // we have to format this property into a HTML format
                travelMode: step.travel_mode,
            };
    
            // stepObj.address = this.getPlaceNameByCoordinates(step.start_location);
            promises.push(this.getPlaceNameByCoordinates(step.start_location));
            
            allSteps.push(stepObj);
            output.steps.push(stepObj);
        });

        this.setState({ steps: allSteps });

        Promise.all(promises).then((addresses) => {
            // console.log('address: ', addresses);
            this.setState({ addresses });
        }, (error) => {
            console.log('promise error: ', error);
            this.setState({ hasError: true});
        });

        //this.setState({ steps: allSteps });
    }
    
    processLegsInfo(legs) {
        let data = legs[0]; // don't have any other data
        output.totalDistance = data.distance.text;
        output.totalDuration = data.duration.text;
        this.state.totalDistance = data.distance.text;
        this.state.totalDuration = data.duration.text;
    
        this.processSteps(data.steps);
    }

    async getDirections(source, destination) {
        try {
            let url = `https://maps.googleapis.com/maps/api/directions/json?origin=${source}&destination=${destination}&mode=${MODE}&key=${API_KEY}`,
                response,
                responseJSON;
            
            console.log(`Direction Url: ${url}`);
            response = await fetch(url);
            responseJSON = await response.json();
    
            console.log('response: ', responseJSON);
    
            this.processLegsInfo(responseJSON.routes[0].legs);
            this.printOutput();
        } catch (error) {
            console.log('Error: ', error);
            this.setState({ hasError: true});
        }
    }

    printOutput() {
        console.log('output: ', output);
    }

    renderElement() {
        console.log('Render Element called!');
        if (this.state.steps.length === this.state.addresses.length) {
            return (
                <FlatList
                    data={this.state.steps}
                    showsVerticalScrollIndicator={false}
                    renderItem={({item, index}) =>
                    <View style={styles.flatview}>
                        <Text style={styles.name}>{this.state.addresses[index]}</Text>
                        <HTML html={item.htmlInstructions} />
                        <Text style={styles.duration}>{item.duration}</Text>
                        <Text style={styles.travelmode}>{item.travelMode}</Text>
                    </View>
                    }
                    keyExtractor={item => item.key}
                />
            )


            // return this.state.steps.map((step, index) => (
            //     <View>
            //         <Text>{this.state.addresses[index]}</Text>
            //         <Text>Duration: {step.duration}</Text>
            //         {/* <Text>Travel Mode: {step.travelMode}</Text> */}
            //     </View>
            // ))
        }
    }

    render() {
        return (
        <View style={styles.container}>
            <Text style={styles.h2text}>Transit</Text>
            { this.state.addresses.length > 0 } && 
            (
                <Text>Total Distance: {this.state.totalDistance}</Text>
                <Text>Total Duration: {this.state.totalDuration}</Text>

                {this.renderElement()};
            )
        </View>
        );
    }
}

const styles = StyleSheet.create({
    container: {
      flex: 1,
      marginTop: 50,
      padding: 10,
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
    flatview: {
      justifyContent: 'center',
      paddingTop: 30,
      borderRadius: 2,
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