import React from 'react';
import { StyleSheet, Text, TextInput, View, FlatList, ScrollView, Image } from 'react-native';
import HTML from 'react-native-render-html';

import CONSTANT from './constant';
import helper from './utils/helper';
import GooglePlacesInput from './Place';

const MODE = 'transit';
const API_KEY = CONSTANT.API_KEY;
const defaultErrorMessage = 'Something went wrong...';

let source = 'Biberstraße, 41564 Kaarst, Germany',
    destination = 'Norf, 41469 Neuss, Germany';

export default class App extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            source: source,
            destination: destination,
            steps: [],
            basicInfo: {},
            hasError: false,
            errorText: defaultErrorMessage,
        };
    }

    componentDidMount() {
        console.log(this.state.source, this.state.destination);
        /* 
         * To check with sample JSON, turn off the getDirections call 
         * and turn on the other line: processLegsInfo  
         ***/

        this.getDirections(this.state.source, this.state.destination);

        // this.processLegsInfo();
    }

    processLegsInfo(leg) {
        let result = helper(leg);
        this.setState({ basicInfo: result.basicInfo, steps: result.steps });
    }

    checkDirectionAPIStatus(response) {
        switch (response.status) {
            case 'OK':
                this.setState({ hasError: false});
                this.processLegsInfo(response.routes[0].legs[0]);
                break;
            case 'OVER_QUERY_LIMIT':
                // this.setState({ errorText: response.error_message});
                this.setState({ errorText: 'Something went wrong. Please check API Key validity!'});
                this.setState({ hasError: true});
                break;
            case 'ZERO_RESULTS':
                this.setState({ errorText: 'No results found for this route using transit mode!'});
                this.setState({ hasError: true});
                break;
            default:
                this.setState({ errorText: defaultErrorMessage});
                this.setState({ hasError: true});
                break;
        }
    }

    async getDirections(source, destination) {
        try {
            let url = `https://maps.googleapis.com/maps/api/directions/json?origin=${source}&destination=${destination}&mode=${MODE}&key=${API_KEY}`,
                response,
                responseJSON;
            
            console.log(`Direction Url: ${url}`);
            response = await fetch(url);
            responseJSON = await response.json();
            // console.log('response json: ', responseJSON);

            this.checkDirectionAPIStatus(responseJSON);
            
        } catch (error) {
            console.log('Error while getting directions: ', error);
            this.setState({ hasError: true});
        }
    }

    divider() {
        return(
            <View
                style={{
                    borderBottomColor: 'lightgrey',
                    borderBottomWidth: 1,
                    marginTop: 15,
                    marginBottom: 10,
                }}
          />
        )
    }


    onSubmit() {
        console.log(`Submit: ${this.state.source} - ${this.state.destination}`);
        this.getDirections(this.state.source, this.state.destination);
    }

    renderLeftPart(step) {
        let icon = 'https://maps.gstatic.com/mapfiles/transit/iw2/6/walk.png'; // walking image

        if (step.travelMode === CONSTANT.TRAVEL_MODE.TRANSIT) {
            icon = `https:${step.lineInfo.vehicle.local_icon || step.lineInfo.vehicle.icon}`;
        }

        return (
            <View style={styles.leftPartWrapper}>
                <Text style={{fontWeight: 'bold'}}>{step.time.toUpperCase()}</Text>
                <View style={{justifyContent: 'center', alignItems: 'center', height: 100}}>
                    <Image source={{uri: icon}}
                        style = {{ width: 20, height: 20 }}
                    />
                </View>
            </View>
        )
    }

    renderWalkingInnerSteps(innerSteps) {
        return (
            <FlatList
                data={innerSteps}
                ItemSeparatorComponent={this.divider}
                showsVerticalScrollIndicator={false}
                renderItem={({item, index}) =>
                <View style={{}}>
                    <HTML html={item} />
                </View>
                }
                keyExtractor={(item, index) => index.toString()}
            />
        )
    }

    renderWalkingDetails(step) {
        return (
            <View>
                <Text style={styles.headSign}>{step.headSign}</Text>
                <Text style={styles.stopsInfo}>About {step.duration}, {step.distance}</Text>

                {step.innerSteps.length && 
                    <View style={{marginTop: 20}}>
                        {this.renderWalkingInnerSteps(step.innerSteps)}
                    </View>
                }
            </View>
        )
    }

    renderTransitDetails(step) {
        return (
            <View>
                <View style={{flexDirection: 'row'}}>
                    <Text style={{height: 20, borderWidth: 2, borderColor: 'black'}}>{step.lineInfo.short_name}</Text>
                    <Text style={styles.headSign}> {step.headSign}</Text>
                </View>
                <Text style={styles.stopsInfo}>{step.duration} ({step.numOfSteps} stops)</Text>
            </View>
        )
    }

    renderRightPart(step) {
        return (
            <View style={{flex: 5}}>
                <Text style={{fontSize: 18, fontWeight: 'bold'}}>{step.name}</Text>
                {this.divider()}
                {
                    step.travelMode === CONSTANT.TRAVEL_MODE.WALKING 
                    ? this.renderWalkingDetails(step) 
                    : this.renderTransitDetails(step)
                }
            </View>
        )
    }
    
    lastCircle() {
        return (
            <View style={styles.lastOuterCircle}>
                <View style={styles.lastInnerCircle}></View>
            </View>
        )
    }

    renderMiddlePart(step) {
        let contentHeight = step.innerSteps ? 150 + step.innerSteps.length * 50 : 150;
        return (
            <View style={{flex: 1, height: contentHeight, marginLeft: -30}}>      
                <View>
                    <View style={styles.openCircle}></View>
                    <View style={styles.verticalLine}></View>
                </View>
            </View>
        )
    }

    renderLastRow(step) {
        return (
            <View style={{marginTop: 40, flexDirection: 'row'}} key={step.time}>
                <View style={styles.leftPartWrapper}>
                    <Text style={{fontWeight: 'bold'}}>{step.time.toUpperCase()}</Text>
                </View>

                <View style={styles.lastCircleWrapper}>
                    {this.lastCircle()}
                </View>

                <View style={{flex: 5}}>
                    <Text style={{fontSize: 18, fontWeight: 'bold'}}>{step.name}</Text>
                </View>
            </View>
        )
    }

    renderContent() {
        if (this.state.hasError) {
            return (
                <View style={styles.errorContentWrapper}>
                    <Text style={styles.error}>{this.state.errorText}</Text>
                </View>
            )
        } else {
            return this.state.steps.map((step, index) => {
                if (index === this.state.steps.length -1) {
                    return (this.renderLastRow(step))
                } else {
                    return (
                        <View style={{marginTop: index === 0 ? 100 : 40, flexDirection: 'row'}} key={step.time}>
                            {this.renderLeftPart(step)}
                            {this.renderMiddlePart(step)}
                            {this.renderRightPart(step)}
                        </View>
                    )
                }
            });
        }
    }

    render() {
        return (
            <ScrollView>
                <View style={styles.container}>
                    <Text style={styles.h2text}>Transit</Text>

                    <View style={styles.source}>
                        {/* <GooglePlacesInput placeholder='source'/> */}
                        <TextInput
                            style={styles.inputField}
                            placeholder="Source"
                            value={this.state.source}
                            onChangeText={(text) => this.setState({source: text})}
                            onSubmitEditing={() => this.onSubmit()}
                        />
                    </View>

                    <View style={styles.destination}>
                        {/* <GooglePlacesInput placeholder='destination'/> */}
                        <TextInput
                            style={styles.inputField}
                            placeholder="Destination"
                            value={this.state.destination}
                            onChangeText={(text) => this.setState({destination: text})}
                            onSubmitEditing={() => this.onSubmit()}
                        />
                    </View>

                    {this.renderContent()}
                </View>
            </ScrollView>
        
        )
    }
}

const styles = StyleSheet.create({
    container: {
      flex: 1,
      paddingTop: 10,
      alignItems: 'center',
      backgroundColor: '#F5FCFF',
    },
    h2text: {
      marginTop: 10,
      fontSize: 24,
      fontWeight: 'bold'
    },
    source: {
        position: 'absolute',
        left: 0,
        top: 50,
        width: '100%',
        zIndex: 999,
        backgroundColor: 'skyblue',
    },
    destination: {
        position: 'absolute',
        left: 0,
        top: 90,
        width: '100%',
        zIndex: 998,
        backgroundColor: 'skyblue',
    },
    inputField: {
        height: 38,
        padding: 10,
        borderColor: 'lightgrey',
        borderWidth: 1
    },
    leftPartWrapper: {
        flex: 2, 
        flexDirection: 'column', 
        paddingLeft: 10
    },
    lastCircleWrapper: {
        flex: 1, 
        height: 100, 
        marginLeft: -30,
    },
    lastOuterCircle: {
        height: 20,
        width: 20, 
        borderWidth: 3, 
        borderColor: 'black', 
        borderRadius: 10,
    },
    lastInnerCircle: {
        height: 8, 
        width: 8, 
        backgroundColor: '#333333', 
        borderRadius: 4, 
        margin: 3,
    },
    openCircle: {
        height: 20, 
        width: 20, 
        borderWidth: 3, 
        borderColor: '#333333', 
        borderRadius: 10,
    },
    verticalLine: {
        height: '100%', 
        marginLeft: 8, 
        borderLeftWidth: 3, 
        borderStyle: 'solid', 
        borderColor: '#1facf2',
    },
    headSign: {
        fontSize: 18, 
        color: '#4b4b4b',
    },
    stopsInfo: {
        color: '#999999', 
        marginTop: 5,
    },
    errorContentWrapper: {
        height: '100%',
        marginTop: 100,
    },
    error: {
        padding: 20,
        fontSize: 12,
    },
    
  });
