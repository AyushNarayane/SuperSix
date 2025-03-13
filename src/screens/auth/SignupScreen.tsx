import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, ScrollView } from 'react-native';
import { useAuth } from '../../hooks/useAuth';

export const SignupScreen = ({ navigation }: { navigation: any }) => {
  const { loginWithRole, error: authError, loading } = useAuth();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [branch, setBranch] = useState<'wardha' | 'nagpur' | 'butibori' | ''>('');
  const [error, setError] = useState<string | null>(null);

  const validateForm = () => {
    setError(null);
    
    if (!name || !phone || !email || !password || !confirmPassword || !branch) {
      setError('All fields are required');
      return false;
    }
    
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please enter a valid email address');
      return false;
    }
    
    if (!/^\d{10}$/.test(phone)) {
      setError('Please enter a valid 10-digit phone number');
      return false;
    }
    
    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      return false;
    }
    
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return false;
    }
    
    return true;
  };

  const handleSignup = async () => {
    try {
      if (!validateForm()) {
        return;
      }
      
      // Use the existing loginWithRole function but with additional user data
      const success = await loginWithRole(email, password, 'student', {
        name,
        phone,
        branch: branch || undefined,
      });
      
      if (!success) {
        setError('Signup failed. Please try again.');
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
      console.error('Signup error:', err);
    }
  };

  const navigateToLogin = () => {
    // Navigate back to login screen
    navigation.goBack();
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Create Account</Text>
      
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Full Name"
          value={name}
          onChangeText={setName}
          autoCapitalize="words"
        />
        <TextInput
          style={styles.input}
          placeholder="Phone Number"
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
          maxLength={10}
        />
        <TextInput
          style={styles.input}
          placeholder="Email Address"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <TextInput
          style={styles.input}
          placeholder="Create Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
        <TextInput
          style={styles.input}
          placeholder="Confirm Password"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
        />
        
        <Text style={styles.branchLabel}>Select Branch:</Text>
        <View style={styles.branchContainer}>
          <TouchableOpacity 
            style={[styles.branchButton, branch === 'wardha' && styles.activeBranch]}
            onPress={() => setBranch('wardha')}
          >
            <Text style={[styles.branchText, branch === 'wardha' && styles.activeBranchText]}>Wardha</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.branchButton, branch === 'nagpur' && styles.activeBranch]}
            onPress={() => setBranch('nagpur')}
          >
            <Text style={[styles.branchText, branch === 'nagpur' && styles.activeBranchText]}>Nagpur</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.branchButton, branch === 'butibori' && styles.activeBranch]}
            onPress={() => setBranch('butibori')}
          >
            <Text style={[styles.branchText, branch === 'butibori' && styles.activeBranchText]}>Butibori</Text>
          </TouchableOpacity>
        </View>
        
        <TouchableOpacity 
          style={styles.button} 
          onPress={handleSignup}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Sign Up</Text>
          )}
        </TouchableOpacity>
      </View>

      {(error || authError) && <Text style={styles.error}>{error || authError}</Text>}
      
      <View style={styles.loginContainer}>
        <Text style={styles.loginText}>Already have an account?</Text>
        <TouchableOpacity 
          style={styles.loginButton}
          onPress={navigateToLogin}
        >
          <Text style={styles.loginButtonText}>Login</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f5f5f5'
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20
  },
  inputContainer: {
    width: '100%',
    maxWidth: 300
  },
  input: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 5,
    marginBottom: 10,
    width: '100%'
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 5,
    width: '100%',
    alignItems: 'center',
    marginTop: 10
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16
  },
  error: {
    color: 'red',
    marginTop: 10,
    textAlign: 'center'
  },
  loginContainer: {
    flexDirection: 'row',
    marginTop: 20,
    alignItems: 'center'
  },
  loginText: {
    marginRight: 5
  },
  loginButton: {
    padding: 5
  },
  loginButtonText: {
    color: '#007AFF',
    fontWeight: 'bold'
  },
  branchLabel: {
    marginTop: 5,
    marginBottom: 5,
    fontWeight: 'bold'
  },
  branchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10
  },
  branchButton: {
    flex: 1,
    padding: 10,
    borderRadius: 5,
    backgroundColor: '#ddd',
    marginHorizontal: 2,
    alignItems: 'center'
  },
  activeBranch: {
    backgroundColor: '#007AFF'
  },
  branchText: {
    color: '#000',
    fontSize: 12
  },
  activeBranchText: {
    color: '#fff'
  }
});