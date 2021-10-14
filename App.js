import * as React from 'react';
import { useEffect }  from 'react'
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import Homescreen from './src/app/navigation/HomeScreen';
import Files from './src/app/navigation/Files';
import SplashScreen from 'react-native-splash-screen';

const Stack =  createStackNavigator();

function App() {

  useEffect(()=>{
    SplashScreen.hide();
  }, [])

  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Home">
        <Stack.Screen name="Home" component={Homescreen} options={{title: 'Search'}}/>
        <Stack.Screen name="Files" component={Files} options={{title: 'Files'}}/>
      </Stack.Navigator>
    </NavigationContainer>
  );

}

export default App;