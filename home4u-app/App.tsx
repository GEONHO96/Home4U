import { TouchableOpacity, Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import LoginScreen from './src/screens/LoginScreen';
import PropertyListScreen from './src/screens/PropertyListScreen';
import PropertyDetailScreen from './src/screens/PropertyDetailScreen';
import FavoritesScreen from './src/screens/FavoritesScreen';

export type RootStackParamList = {
  Login: undefined;
  PropertyList: undefined;
  PropertyDetail: { id: number };
  Favorites: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <NavigationContainer>
      <StatusBar style="dark" />
      <Stack.Navigator
        initialRouteName="Login"
        screenOptions={{
          headerStyle: { backgroundColor: '#ffffff' },
          headerTintColor: '#111418',
          headerTitleStyle: { fontWeight: '700' },
          contentStyle: { backgroundColor: '#f7f8fa' },
        }}
      >
        <Stack.Screen name="Login" component={LoginScreen} options={{ title: 'Home4U' }} />
        <Stack.Screen
          name="PropertyList"
          component={PropertyListScreen}
          options={({ navigation }) => ({
            title: '매물 목록',
            headerRight: () => (
              <TouchableOpacity onPress={() => navigation.navigate('Favorites')} hitSlop={10}>
                <Text style={{ color: '#1673ff', fontWeight: '700' }}>♥ 찜</Text>
              </TouchableOpacity>
            ),
          })}
        />
        <Stack.Screen name="PropertyDetail" component={PropertyDetailScreen} options={{ title: '매물 상세' }} />
        <Stack.Screen name="Favorites" component={FavoritesScreen} options={{ title: '찜한 매물' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
