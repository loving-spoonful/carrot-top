App.info({
  id: 'org.lovingspoonful.meatup',
  name: 'The Meat Up',
  description: 'An tool for ordering meat and poultry from the Loving Spoonful charity.',
  author: 'David Lougheed, adapting open source code from Percolate Studio Team.',
  email: 'info@lovingspoonful.org',
  website: 'http://lovingspoonful.org/',
  version: '0.2.0'
});

App.icons({
  // iOS
  // 'iphone': 'resources/icons/icon-60x60.png', (NO LONGER USED)
  'iphone_2x': 'resources/icons/icon-60x60@2x.png',
  'ipad': 'resources/icons/icon-76x76.png',
  'ipad_2x': 'resources/icons/icon-76x76@2x.png',

  // Android
  // 'android_ldpi': 'resources/icons/icon-36x36.png', (NO LONGER USED)
  'android_mdpi': 'resources/icons/icon-48x48.png',
  'android_hdpi': 'resources/icons/icon-72x72.png',
  'android_xhdpi': 'resources/icons/icon-96x96.png'
});

App.launchScreens({
  // iOS
  // 'iphone': 'resources/splash/splash-320x480.png', (NO LONGER USED)
  'iphone_2x': 'resources/splash/splash-320x480@2x.png',
  'iphone5': 'resources/splash/splash-320x568@2x.png',
  'ipad_portrait': 'resources/splash/splash-768x1024.png',
  'ipad_portrait_2x': 'resources/splash/splash-768x1024@2x.png',
  'ipad_landscape': 'resources/splash/splash-1024x768.png',
  'ipad_landscape_2x': 'resources/splash/splash-1024x768@2x.png',

  // Android
  // 'android_ldpi_portrait': 'resources/splash/splash-200x320.png',  (NO LONGER USED)
  // 'android_ldpi_landscape': 'resources/splash/splash-320x200.png', (NO LONGER USED)
  'android_mdpi_portrait': 'resources/splash/splash-320x480.png',
  'android_mdpi_landscape': 'resources/splash/splash-480x320.png',
  'android_hdpi_portrait': 'resources/splash/splash-480x800.png',
  'android_hdpi_landscape': 'resources/splash/splash-800x480.png',
  'android_xhdpi_portrait': 'resources/splash/splash-720x1280.png',
  'android_xhdpi_landscape': 'resources/splash/splash-1280x720.png'
});

App.setPreference('StatusBarOverlaysWebView', 'false');
App.setPreference('StatusBarStyle', 'lightcontent');
App.setPreference('StatusBarBackgroundColor', '#000000');
