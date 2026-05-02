import React, { useState } from 'react';
import {
  View, TextInput, Text, TouchableOpacity,
  StyleSheet, ViewStyle, KeyboardTypeOptions,
} from 'react-native';
import { Colors, Typography, Spacing, Radius } from '../../theme';

interface InputProps {
  label?: string;
  placeholder?: string;
  value: string;
  onChangeText: (text: string) => void;
  secureTextEntry?: boolean;
  keyboardType?: KeyboardTypeOptions;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  error?: string;
  style?: ViewStyle;
  editable?: boolean;
}

export const Input: React.FC<InputProps> = ({
  label,
  placeholder,
  value,
  onChangeText,
  secureTextEntry = false,
  keyboardType = 'default',
  autoCapitalize = 'sentences',
  error,
  style,
  editable = true,
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  return (
    <View style={[styles.container, style]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={[styles.inputWrapper, isFocused && styles.focused, error ? styles.error : null]}>
        <TextInput
          style={styles.input}
          placeholder={placeholder}
          placeholderTextColor={Colors.text.muted}
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={secureTextEntry && !showPassword}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          editable={editable}
        />
        {secureTextEntry && (
          <TouchableOpacity
            onPress={() => setShowPassword(!showPassword)}
            style={styles.eyeBtn}
          >
            <Text style={styles.eyeIcon}>{showPassword ? '🙈' : '👁'}</Text>
          </TouchableOpacity>
        )}
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { marginBottom: Spacing.base },
  label: { ...Typography.label, color: Colors.text.secondary, marginBottom: Spacing.xs },
  inputWrapper: {
    backgroundColor: Colors.background.secondary,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    borderColor: Colors.border.default,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
  },
  focused: { borderColor: Colors.brand.gold },
  error: { borderColor: Colors.status.error },
  input: {
    flex: 1,
    ...Typography.bodyLarge,
    color: Colors.text.primary,
    paddingVertical: Spacing.md,
  },
  eyeBtn: { padding: Spacing.xs },
  eyeIcon: { fontSize: 18 },
  errorText: { ...Typography.bodySmall, color: Colors.status.error, marginTop: Spacing.xs },
});
