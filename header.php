<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <?php 
  date_default_timezone_set("Asia/Kolkata");
  
  ob_start();
  $title = isset($_GET['page']) ? ucwords(str_replace("_", ' ', $_GET['page'])) : "Home";
  $title = str_replace("Persons Companies","Persons/Companies",$title);
  ?>
  <title><?php echo $title ?> | <?php echo $_SESSION['system']['name'] ?></title>
  <?php ob_end_flush() ?>



<link rel="icon" type="image/x-icon" href="assets/uploads/logo1.jpg">

  
  <link rel="stylesheet" href="https://fonts.googleapis.com/css?family=Source+Sans+Pro:300,400,400i,700&display=fallback">
  
  <link rel="stylesheet" href="assets/plugins/fontawesome-free/css/all.min.css">
  
  <link rel="stylesheet" href="assets/plugins/overlayScrollbars/css/OverlayScrollbars.min.css">
    
  <link rel="stylesheet" href="assets/plugins/datatables-bs4/css/dataTables.bootstrap4.min.css">
  <link rel="stylesheet" href="assets/plugins/datatables-responsive/css/responsive.bootstrap4.min.css">
  <link rel="stylesheet" href="assets/plugins/datatables-buttons/css/buttons.bootstrap4.min.css">
   
  <link rel="stylesheet" href="assets/plugins/select2/css/select2.min.css">
  <link rel="stylesheet" href="assets/plugins/select2-bootstrap4-theme/select2-bootstrap4.min.css">
   
  <link rel="stylesheet" href="assets/plugins/sweetalert2-theme-bootstrap-4/bootstrap-4.min.css">
  
  <link rel="stylesheet" href="assets/plugins/toastr/toastr.min.css">
  
  <link rel="stylesheet" href="assets/plugins/dropzone/min/dropzone.min.css">
  
  <link rel="stylesheet" href="assets/plugins/boostrap-min/css/jquery.datetimepicker.min.css">
  
  <link rel="stylesheet" href="assets/plugins/icheck-bootstrap/icheck-bootstrap.min.css">
  
  <link rel="stylesheet" href="assets/plugins/bootstrap4-toggle/css/bootstrap4-toggle.min.css">
  
  <link rel="stylesheet" href="assets/plugins/boostrap-min/css/main.min.css">
  <link rel="stylesheet" href="assets/plugins/boostrap-min/css/styles.css">
	<script src="assets/plugins/jquery/jquery.min.js"></script>
  
  <script src="assets/plugins/jquery-ui/jquery-ui.min.js"></script>
 
  <link rel="stylesheet" href="assets/plugins/summernote/summernote-bs4.min.css">
  
</head><style>
  .marquee {
    color: red;
    white-space: nowrap;
    overflow: hidden;
    animation: marquee 40s linear infinite; /* Adjusted duration for slower speed */
  }

  @keyframes marquee {
    0% { transform: translateX(100%); }
    100% { transform: translateX(-100%); }
  }
</style>