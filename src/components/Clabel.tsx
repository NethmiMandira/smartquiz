import { View, Text } from 'react-native'
import React from 'react'

const Clabel = (props:any) => {
  return (
    <View>
      <Text style={{fontSize:40,
        color:'red',
        fontWeight:'700'
      }}>{props.children}</Text>
    </View>
  )
}

export default Clabel