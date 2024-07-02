const path = require('path');

module.exports = {
  mode: 'production', // أو 'development' حسب الحاجة
  entry: './public/js/index.js', // نقطة دخول الكود الخاص بك
  output: {
    path: path.resolve(__dirname, 'public/js'), // مسار الخرج
    filename: 'bundle.js', // اسم ملف الخرج
  },
  target: 'web', // تحديد البيئة الهدف كـ web (متصفح)
  module: {
    rules: [
      {
        test: /\.js$/, // التعامل مع ملفات .js
        exclude: /node_modules/, // استثناء مجلد node_modules
        use: {
          loader: 'babel-loader', // استخدام Babel لتحويل الكود
          options: {
            presets: ['@babel/preset-env'], // الإعدادات المطلوبة لـ Babel
          },
        },
      },
    ],
  },
};
