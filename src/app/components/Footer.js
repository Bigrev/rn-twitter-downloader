import * as React from 'react';
import { View, StyleSheet, TouchableOpacity, Dimensions} from 'react-native'
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
const screen = Dimensions.get("screen");
const iconSize = screen.width/8;


const styles =  StyleSheet.create({
    footer:{
        flexDirection:"row",
        backgroundColor:"black",
        width: screen.width,
        height: screen.height/13,
        position:"absolute",
        bottom:0
        }
})

const Footer = (props) => {
    return(
        <>
            <View style={styles.footer}>
                <TouchableOpacity style={{marginLeft:screen.width/3.9, justifyContent:"center"}} onPress={()=> props.navigation.navigate('Home')}>
                    <MaterialCommunityIcons name="movie-search-outline" color={props.homeColor} size={iconSize}/>
                </TouchableOpacity>

                <TouchableOpacity style={{marginLeft:screen.width/3.9, justifyContent:"center"}} onPress={()=> props.navigation.navigate('Files')}>

                    <MaterialCommunityIcons name="file-cabinet" color={props.filesColor} size={iconSize}/>
                </TouchableOpacity>
            </View>
        </>
    );
}

export default Footer;