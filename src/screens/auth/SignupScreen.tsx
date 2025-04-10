import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, ScrollView, KeyboardAvoidingView, Platform, Dimensions, SafeAreaView } from 'react-native';
import { useAuth } from '../../hooks/useAuth';

const districtData = [
  {
    "name":"Ahmednagar",
    "tahasil" : [ "Akola", "Jamkhed", "Karjat", "Kopargaon", "Nagar", "Nevasa", "Parner", "Pathardi", "Rahta", "Rahuri", "Sangamner", "Shevgaon", "Shrigonda", "Shrirampur" ]
  },
  {
    "name":"Akola",
    "tahasil":[ "Akola", "Akot", "Balapur", "Barshitakli", "Murtijapur", "Patur", "Telhara" ]
  },
  {
    "name":"Amravati",
    "tahasil":[ "Achalpur", "Amravati", "Anjangaon Surji", "Bhatkuli", "Chandur Railway", "Chandurbazar", "Chikhaldara", "Daryapur", "Dhamangaon Railway", "Dharni", "Morshi", "Nandgaon-Khandeshwar", "Teosa", "Warud" ]
  },
  {
    "name":"Aurangabad",
    "tahasil":[ "Aurangabad", "Gangapur", "Kannad", "Khuldabad", "Paithan", "Phulambri", "Sillod", "Soegaon", "Vaijapur" ]
  },
  {
    "name":"Beed",
    "tahasil":[ "Ambejogai", "Ashti", "Bid", "Dharur", "Georai", "Kaij", "Manjlegaon", "Parli", "Patoda", "Shirur (Kasar)", "Wadwani" ]
  },
  {
    "name":"Bhandara",
    "tahasil":[ "Bhandara", "Mohadi", "Pauni", "Tumsar" ]
  },
  {
    "name":"Buldhana",
    "tahasil":[ "Buldana", "Chikhli", "Deolgaon Raja", "Jalgaon (Jamod)", "Khamgaon", "Lonar", "Malkapur", "Mehkar", "Motala", "Nandura", "Sangrampur", "Shegaon", "Sindkhed Raja" ]
  },
  {
    "name":"Chandrapur",
    "tahasil":[ "Ballarpur", "Bhadravati", "Brahmapuri", "Chandrapur", "Chimur", "Gondpipri", "Jiwati", "Korpana", "Mul", "Nagbhir", "Pombhurna", "Rajura", "Sawali", "Sindewahi", "Warora" ]
  },
  {
    "name":"Dhule",
    "tahasil":[ "Dhule", "Sakri", "Shirpur", "Sindkhede" ]
  },
  {
    "name":"Gadchiroli",
    "tahasil":[ "Aheri", "Armori", "Bhamragad", "Chamorshi", "Desaiganj (Vadasa)", "Dhanora", "Etapalli", "Gadchiroli", "Korchi", "Kurkheda", "Mulchera", "Sironcha" ]
  },
  {
    "name":"Gondia",
    "tahasil":[ "Amgaon", "Arjuni Morgaon", "Deori", "Gondiya", "Goregaon", "Sadak-Arjuni", "Salekasa", "Tirora" ]
  },
  {
    "name":"Hingoli",
    "tahasil":[ "Aundha (Nagnath)", "Basmath", "Hingoli", "Kalamnuri", "Sengaon" ]
  },
  {
    "name":"Jalgaon",
    "tahasil":[ "Amalner", "Bhadgaon", "Bhusawal", "Bodvad", "Chalisgaon", "Chopda", "Dharangaon", "Erandol", "Jalgaon", "Jamner", "Muktainagar", "Pachora", "Parola", "Raver", "Yawal" ]
  },
  {
    "name":"Jalna",
    "tahasil":[ "Ambad", "Badnapur", "Bhokardan", "Ghansawangi", "Jafferabad", "Jalna", "Mantha", "Partur" ]
  },
  {
    "name":"Kolhapur",
    "tahasil":[ "Ajra", "Bavda", "Bhudargad", "Chandgad", "Gadhinglaj", "Hatkanangle", "Kagal", "Karvir", "Panhala", "Radhanagari", "Shahuwadi", "Shirol" ]
  },
  {
    "name":"Latur",
    "tahasil":[ "Ahmadpur", "Ausa", "Chakur", "Deoni", "Jalkot", "Latur", "Nilanga", "Renapur", "Shirur-Anantpal", "Udgir" ]
  },
  {
    "name":"Mumbai Suburban",
    "tahasil":[ "Andheri", "Borivali", "Kurla" ]
  },
  {
    "name":"Nagpur",
    "tahasil":[ "Bhiwapur", "Hingna", "Kalameshwar", "Kamptee", "Katol", "Kuhi", "Mauda", "Nagpur (Rural)", "Nagpur (Urban)", "Narkhed", "Parseoni", "Ramtek", "Savner", "Umred" ]
  },
  {
    "name":"Nanded",
    "tahasil":[ "Ardhapur", "Bhokar", "Biloli", "Deglur", "Dharmabad", "Hadgaon", "Himayatnagar", "Kandhar", "Kinwat", "Loha", "Mahoor", "Mudkhed", "Mukhed", "Naigaon (Khairgaon)", "Nanded", "Umri" ]
  },
  {
    "name":"Nandurbar",
    "tahasil":[ "Akkalkuwa", "Akrani", "Nandurbar", "Nawapur", "Shahade", "Talode" ]
  },
  {
    "name":"Nashik",
    "tahasil":[ "Baglan", "Chandvad", "Deola", "Dindori", "Igatpuri", "Kalwan", "Malegaon", "Nandgaon", "Nashik", "Niphad", "Peint", "Sinnar", "Surgana", "Trimbakeshwar", "Yevla" ]
  },
  {
    "name":"Osmanabad",
    "tahasil":[ "Bhum", "Kalamb", "Lohara", "Osmanabad", "Paranda", "Tuljapur", "Umarga", "Washi" ]
  },
  {
    "name":"Parbhani",
    "tahasil":[ "Gangakhed", "Jintur", "Manwath", "Palam", "Parbhani", "Pathri", "Purna", "Sailu", "Sonpeth" ]
  },
  {
    "name":"Pune",
    "tahasil":[ "Ambegaon", "Baramati", "Bhor", "Daund", "Haveli", "Indapur", "Junnar", "Khed", "Mawal", "Mulshi", "Pune City", "Purandhar", "Shirur", "Velhe" ]
  },
  {
    "name":"Raigad",
    "tahasil":[ "Alibag", "Karjat", "Khalapur", "Mahad", "Mangaon", "Mhasla", "Murud", "Panvel", "Pen", "Poladpur", "Roha", "Shrivardhan", "Sudhagad", "Tala", "Uran" ]
  },
  {
    "name":"Ratnagiri",
    "tahasil":[ "Chiplun", "Dapoli", "Guhagar", "Khed", "Lanja", "Mandangad", "Rajapur", "Ratnagiri", "Sangameshwar" ]
  },
  {
    "name":"Sangli",
    "tahasil":[ "Atpadi", "Jat", "Kadegaon", "Kavathemahankal", "Khanapur", "Miraj", "Palus", "Shirala", "Tasgaon", "Walwa" ]
  },
  {
    "name":"Satara",
    "tahasil":[ "Jaoli", "Karad", "Khandala", "Khatav", "Koregaon", "Mahabaleshwar", "Man", "Patan", "Phaltan", "Satara", "Wai" ]
  },
  {
    "name":"Sindhudurg",
    "tahasil":[ "Devgad", "Dodamarg", "Kankavli", "Kudal", "Malwan", "Sawantwadi", "Vaibhavvadi", "Vengurla" ]
  },
  {
    "name":"Solapur",
    "tahasil":[ "Akkalkot", "Barshi", "Karmala", "Madha", "Malshiras", "Mangalvedhe", "Mohol", "Pandharpur", "Sangole", "Solapur North", "Solapur South" ]
  },
  {
    "name":"Thane",
    "tahasil":[ "Ambarnath", "Bhiwandi", "Dahanu", "Jawhar", "Kalyan", "Mokhada", "Murbad", "Palghar", "Shahapur", "Talasari", "Thane", "Ulhasnagar", "Vada", "Vasai", "Vikramgad" ]
  },
  {
    "name":"Washim",
    "tahasil":[ "Karanja", "Malegaon", "Mangrulpir", "Manora", "Risod", "Washim" ]
  },
  {
    "name":"Yavatmal",
    "tahasil":["Arni", "Babulgaon", "Darwha", "Digras", "Ghatanji", "Kalamb", "Kelapur", "Mahagaon", "Maregaon", "Ner", "Pusad", "Ralegaon", "Umarkhed", "Wani", "Yavatmal", "Zari-Jamani"]
  }
];

export const SignupScreen = ({ navigation }: { navigation: any }) => {
  const { loginWithRole, error: authError, loading } = useAuth();
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [branch, setBranch] = useState<'wardha' | 'nagpur' | 'butibori' | 'akola' | ''>('');
  const [district, setDistrict] = useState('');
  const [tehsil, setTehsil] = useState('');
  const [village, setVillage] = useState('');
  const [street, setStreet] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [showDistrictPicker, setShowDistrictPicker] = useState(false);
  const [showTehsilPicker, setShowTehsilPicker] = useState(false);
  const [showVillagePicker, setShowVillagePicker] = useState(false);

  const districts = districtData.map(d => d.name);
  const [availableTehsils, setAvailableTehsils] = useState<string[]>([]);

  useEffect(() => {
    if (district) {
      const selectedDistrict = districtData.find(d => d.name === district);
      if (selectedDistrict) {
        setAvailableTehsils(selectedDistrict.tahasil);
      } else {
        setAvailableTehsils([]);
      }
      // Reset tehsil when district changes
      setTehsil('');
    }
  }, [district]);

  const handleDistrictSelect = (selectedDistrict: string) => {
    setDistrict(selectedDistrict);
    setShowDistrictPicker(false);
  };

  const handleTehsilSelect = (selectedTehsil: string) => {
    setTehsil(selectedTehsil);
    setShowTehsilPicker(false);
  };

  const handleVillageSelect = (selectedVillage: string) => {
    setVillage(selectedVillage);
    setShowVillagePicker(false);
  };

  const validateForm = () => {
    setError(null);
    
    if (!name || !phone || !email || !password || !confirmPassword || !branch || !district || !tehsil || !village) {
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
        address: {
          district,
          tehsil,
          village,
          street: street || undefined,
        },
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

  const handleNext = () => {
    if (!validateBasicInfo()) return;
    setStep(2);
  };

  const validateBasicInfo = () => {
    setError(null);
    
    if (!name || !phone || !email || !password || !confirmPassword || !branch) {
      setError('Please fill in all required fields');
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

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
      >
        <ScrollView 
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.title}>Create Account</Text>
          <View style={styles.stepIndicator}>
            <View style={[styles.stepDot, step >= 1 && styles.activeStepDot]} />
            <View style={styles.stepLine} />
            <View style={[styles.stepDot, step >= 2 && styles.activeStepDot]} />
          </View>
      
      <View style={styles.inputContainer}>
        {step === 1 ? (
          <>
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
              <TouchableOpacity 
                style={[styles.branchButton, branch === 'akola' && styles.activeBranch]}
                onPress={() => setBranch('akola')}
              >
                <Text style={[styles.branchText, branch === 'akola' && styles.activeBranchText]}>Akola</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity 
              style={styles.button} 
              onPress={handleNext}
            >
              <Text style={styles.buttonText}>Next</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <Text style={styles.branchLabel}>Address Details:</Text>
            <View style={styles.addressContainer}>
              <Text style={styles.inputLabel}>District</Text>
              <TouchableOpacity 
                style={styles.dropdownButton}
                onPress={() => setShowDistrictPicker(true)}
              >
                <Text style={styles.dropdownButtonText}>{district || 'Select District'}</Text>
                <Text style={styles.dropdownIcon}>▼</Text>
              </TouchableOpacity>

              {showDistrictPicker && (
                <View style={styles.pickerModal}>
                  <View style={styles.pickerContainer}>
                    <View style={styles.pickerHeader}>
                      <Text style={styles.pickerTitle}>Select District</Text>
                      <TouchableOpacity onPress={() => setShowDistrictPicker(false)}>
                        <Text style={styles.closeButton}>✕</Text>
                      </TouchableOpacity>
                    </View>
                    <ScrollView>
                      {districts.map((item, index) => (
                        <TouchableOpacity
                          key={index}
                          style={styles.pickerItem}
                          onPress={() => handleDistrictSelect(item)}
                        >
                          <Text style={styles.pickerItemText}>{item}</Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                </View>
              )}

              <Text style={styles.inputLabel}>Tehsil</Text>
              <TouchableOpacity 
                style={styles.dropdownButton}
                onPress={() => setShowTehsilPicker(true)}
              >
                <Text style={styles.dropdownButtonText}>{tehsil || 'Select Tehsil'}</Text>
                <Text style={styles.dropdownIcon}>▼</Text>
              </TouchableOpacity>

              {showTehsilPicker && (
                <View style={styles.pickerModal}>
                  <View style={styles.pickerContainer}>
                    <View style={styles.pickerHeader}>
                      <Text style={styles.pickerTitle}>Select Tehsil</Text>
                      <TouchableOpacity onPress={() => setShowTehsilPicker(false)}>
                        <Text style={styles.closeButton}>✕</Text>
                      </TouchableOpacity>
                    </View>
                    <ScrollView>
                      {availableTehsils.map((item, index) => (
                        <TouchableOpacity
                          key={index}
                          style={styles.pickerItem}
                          onPress={() => handleTehsilSelect(item)}
                        >
                          <Text style={styles.pickerItemText}>{item}</Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                </View>
              )}

              <Text style={styles.inputLabel}>Village</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter Village Name"
                value={village}
                onChangeText={setVillage}
              />

              <Text style={styles.inputLabel}>Street</Text>
              <TextInput
                style={styles.input}
                placeholder="Street Address (Optional)"
                value={street}
                onChangeText={setStreet}
              />

              <View style={styles.buttonContainer}>
                <TouchableOpacity 
                  style={styles.backButton} 
                  onPress={() => setStep(1)}
                >
                  <Text style={styles.backButtonText}>Back</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={[styles.button, styles.signUpButton]} 
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
            </View>
          </>
        )}
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
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const styles = StyleSheet.create({
  inputLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
    marginTop: 10,
  },
  pickerModal: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  pickerContainer: {
    backgroundColor: '#fff',
    borderRadius: 10,
    width: SCREEN_WIDTH * 0.8,
    maxHeight: SCREEN_HEIGHT * 0.7,
    padding: 15,
  },
  pickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingBottom: 10,
  },
  pickerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    fontSize: 20,
    color: '#666',
    padding: 5,
  },
  pickerItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  pickerItemText: {
    fontSize: 16,
    color: '#333',
  },
  stepIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  stepDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#ddd',
  },
  activeStepDot: {
    backgroundColor: '#007AFF',
  },
  stepLine: {
    flex: 0.1,
    height: 2,
    backgroundColor: '#ddd',
    marginHorizontal: 5,
  },
  buttonContainer: {
    flexDirection: SCREEN_WIDTH < 350 ? 'column' : 'row',
    justifyContent: 'space-between',
    
    gap: 8
  },
  backButton: {
    backgroundColor: '#e0e0e0',
    padding: 12,
    borderRadius: 8,
    flex: SCREEN_WIDTH < 350 ? 0 : 0.48,
    width: SCREEN_WIDTH < 350 ? '100%' : 'auto',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ccc',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.5,
    marginBottom: SCREEN_WIDTH < 350 ? 8 : 0,
  },
  backButtonText: {
    color: '#333',
    fontWeight: '600',
    fontSize: 16,
  },
  safeArea: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SCREEN_WIDTH * 0.05,
    paddingBottom: SCREEN_WIDTH * 0.1,
    backgroundColor: '#f5f5f5'
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20
  },
  inputContainer: {
    width: '100%',
    maxWidth: SCREEN_WIDTH > 600 ? 500 : SCREEN_WIDTH * 0.9,
    alignSelf: 'center'
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
    marginBottom: 10,
    flexWrap: SCREEN_WIDTH < 350 ? 'wrap' : 'nowrap'
  },
  branchButton: {
    flex: SCREEN_WIDTH < 350 ? 0 : 1,
    width: SCREEN_WIDTH < 350 ? '68%' : 'auto',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 5,
    backgroundColor: '#ddd',
    marginHorizontal: 2,
    marginBottom: SCREEN_WIDTH < 350 ? 5 : 0,
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
  },
  addressContainer: {
    width: '100%',
    marginBottom: 15
  },
  dropdownButton: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    marginBottom: 12,
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  dropdownButtonText: {
    fontSize: 16,
    color: '#333',
  },
  dropdownIcon: {
    fontSize: 14,
    color: '#666',
  },
  signUpButton: {
    marginLeft: SCREEN_WIDTH < 350 ? 0 : 10,
    flex: SCREEN_WIDTH < 350 ? 0 : 0.45,
    width: SCREEN_WIDTH < 350 ? '100%' : 'auto',
    backgroundColor: '#007AFF',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 2,
  }
});