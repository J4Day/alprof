# Правила безопасности Firestore

Чтобы исправить ошибку "Missing or insufficient permissions" при сохранении контактных данных, необходимо обновить правила безопасности в Firebase Console.

## Как настроить правила:

1. Откройте [Firebase Console](https://console.firebase.google.com/)
2. Выберите ваш проект `bishtrade-3c96f`
3. Перейдите в раздел **Firestore Database**
4. Откройте вкладку **Rules**
5. Замените текущие правила на следующие:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Правила для коллекции services
    match /services/{serviceId} {
      allow read: if true; // Публичное чтение для отображения на сайте
      allow write: if request.auth != null; // Только авторизованные пользователи могут изменять
    }
    
    // Правила для коллекции products
    match /products/{productId} {
      allow read: if true; // Публичное чтение для отображения на сайте
      allow write: if request.auth != null; // Только авторизованные пользователи могут изменять
    }
    
    // Правила для коллекции settings (включая контакты)
    match /settings/{settingId} {
      allow read: if true; // Публичное чтение для отображения контактов на сайте
      allow write: if request.auth != null; // Только авторизованные пользователи могут изменять
    }
  }
}
```

## Альтернативные правила (более простые, но менее безопасные):

Если у вас возникают проблемы с аутентификацией, можно временно использовать эти правила:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

**⚠️ ВАЖНО:** Эти правила дают полный доступ к базе данных всем пользователям. Используйте их только для тестирования!

## После изменения правил:

1. Нажмите **"Publish"** для применения правил
2. Подождите несколько минут для распространения изменений
3. Попробуйте сохранить контактные данные снова

## Проверка аутентификации:

Убедитесь, что вы авторизованы в админ-панели перед попыткой сохранения контактов.