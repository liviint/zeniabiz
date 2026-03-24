import styled from "styled-components/native";
import { Picker } from "@react-native-picker/picker";

export const BodyText = styled.Text`
    font-family: ${props => props.theme.fonts.body};
    font-size: 16px;
    color: ${props => props.theme.colors.text};
`;
export const SecondaryText = styled.Text`
    font-family: ${props => props.theme.fonts.body};
    font-size: 16px;
    color: ${props => props.theme.colors.secondaryText};
`;

export const Card = styled.View`
  background-color: ${({ theme }) => theme.colors.surface};
  border-radius: 16px;
  padding: 16px;

  shadow-color: #000;
  shadow-offset: 0px 2px;
  shadow-opacity: 0.15;
  shadow-radius: 3px;

  elevation: 3;
  margin-bottom: 16px;
`;

export const Input = styled.TextInput.attrs(({ theme }) => ({
    placeholderTextColor: theme.colors.textMuted,
  }))`
    color: ${({ theme }) => theme.colors.text};
    background-color: ${({ theme }) => theme.colors.surface};

    border-width: 1px;
    border-color: ${({ theme }) => theme.colors.border};
    border-radius: 10px;

    padding: 12px;
    font-size: 16px;
`;


export const TextArea = styled(Input)`
  min-height: 80px;
  text-align-vertical: top;
`;

export const CustomPicker = styled(Picker).attrs(({ theme }) => ({
  dropdownIconColor: theme.colors.text,
}))`
  background-color: ${({ theme }) => theme.colors.surface};
  color: ${({ theme }) => theme.colors.text};
  border-radius: 10px;
`;


export const FormLabel = styled(BodyText)`
  color: ${({ theme }) => theme.colors.labelColor};
  margin-bottom: 6; 
  font-weight: 600; 
  fontSize: 16;
`
