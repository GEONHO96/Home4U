import { TouchableOpacity, Text, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import LoginScreen from './src/screens/LoginScreen';
import PropertyListScreen from './src/screens/PropertyListScreen';
import PropertyDetailScreen from './src/screens/PropertyDetailScreen';
import FavoritesScreen from './src/screens/FavoritesScreen';
import TransactionsScreen from './src/screens/TransactionsScreen';
import ChatListScreen from './src/screens/ChatListScreen';
import ChatRoomScreen from './src/screens/ChatRoomScreen';

export type RootStackParamList = {
  Login: undefined;
  PropertyList: undefined;
  PropertyDetail: { id: number };
  Favorites: undefined;
  Transactions: undefined;
  ChatList: undefined;
  ChatRoom: { roomId: number; peer?: string };
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
              <View style={{ flexDirection: 'row', gap: 14 }}>
                <TouchableOpacity onPress={() => navigation.navigate('ChatList')} hitSlop={10}>
                  <Text style={{ color: '#0e5fe3', fontWeight: '700' }}>💬</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => navigation.navigate('Transactions')} hitSlop={10}>
                  <Text style={{ color: '#0e5fe3', fontWeight: '700' }}>거래</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => navigation.navigate('Favorites')} hitSlop={10}>
                  <Text style={{ color: '#0e5fe3', fontWeight: '700' }}>♥ 찜</Text>
                </TouchableOpacity>
              </View>
            ),
          })}
        />
        <Stack.Screen name="PropertyDetail" component={PropertyDetailScreen} options={{ title: '매물 상세' }} />
        <Stack.Screen name="Favorites" component={FavoritesScreen} options={{ title: '찜한 매물' }} />
        <Stack.Screen name="Transactions" component={TransactionsScreen} options={{ title: '내 거래' }} />
        <Stack.Screen name="ChatList" component={ChatListScreen} options={{ title: '채팅' }} />
        <Stack.Screen
          name="ChatRoom"
          component={ChatRoomScreen}
          options={({ route }) => ({ title: route.params.peer ?? '채팅방' })}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
