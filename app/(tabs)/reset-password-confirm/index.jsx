import { useState, useEffect } from 'react';
import { View } from 'react-native';
import ResetPassword from '../../../src/components/ResetPassword/ResetPasswordConfirm';
import PageLoader from '../../../src/components/common/PageLoader';
import { useThemeStyles } from '../../../src/hooks/useThemeStyles';

const ResetPasswordScreen = () => {
  const [loading, setLoading] = useState(true);
  const {globalStyles} = useThemeStyles()
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
