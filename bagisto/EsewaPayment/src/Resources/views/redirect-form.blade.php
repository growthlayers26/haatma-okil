<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Redirecting to eSewa…</title>
</head>
<body>
    <p>Redirecting to eSewa, please wait…</p>

    <form id="esewa-redirect-form" action="{{ $formUrl }}" method="POST">
        @foreach ($fields as $name => $value)
            <input type="hidden" name="{{ $name }}" value="{{ $value }}">
        @endforeach
    </form>

    <script>
        document.getElementById('esewa-redirect-form').submit();
    </script>
</body>
</html>
