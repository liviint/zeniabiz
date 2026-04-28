import React, { useState, useEffect } from 'react';
import { View } from 'react-native';
import ResetPassword from '../../../src/components/ResetPassword/ResetPassword';
import PageLoader from '../../../src/components/common/PageLoader';
import { useThemeStyles } from '../../../src/hooks/useThemeStyles';

const ResetPasswordScreen = () => {
  const {globalStyles} = useThemeStyles()
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 500); 
    return () => clearTimeout(timer);
  }, []);

  if (loading) return <PageLoader message={"Loading..."} /> 

  return (
    <View style={{...globalStyles.container,flex: 1,justifyContent: "center"}}>
      <ResetPassword />
    </View>
  );
};


export default ResetPasswordScreen;
