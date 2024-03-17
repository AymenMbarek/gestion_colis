<!DOCTYPE html>
<html lang="en">
<?php error_reporting(0);
session_start();
include('./db_connect.php');
  ob_start();

    $system = $conn->query("SELECT * FROM system_settings")->fetch_array();
    foreach($system as $k => $v){
      $_SESSION['system'][$k] = $v;
    }
  ob_end_flush();
?>
<?php 
if(isset($_SESSION['login_id']))
header("location:index.php?page=home");

?>
<?php ?>
<?php include 'header.php' ?>
<body class="hold-transition login-page">

  <div class="limiter">
    
    <div class="container-login100">
      <div class="row"style="align-items: center;">
        <div class="col-md-5">
          <div class="login-aside text-center  d-flex flex-column flex-row-auto">

            <div class="d-flex flex-column-auto flex-column pt-lg-40 pt-15">

            <div class="text-center  brand-logo">

              <img class="logo-abbr" src="assets/uploads/logo.jpg" alt="">
            </div>

            <h3 class="mb-2">Welcome back!</h3>
            

          </div>
          <div class="aside-image" >
            <img src="assets/uploads/pic1.gif" width="200px">
          </div>
        </div>
        </div>


<div class="col-md-7">
              <div class="col-xl-12 tab-content">
              <div class="wrap-login100">
<div class="login-box">
  <div class="login-logo">
    <a href="#"><h3><?php echo $_SESSION['system']['name'] ?> - Authority Login</h3></a>
  </div>
 
  <div class="card-1">
   
      <form action="" id="login-form">

<div class="form-group mb-3">
  <label class="mb-1" for="val-email"><strong>Email</strong></label>
  <div>
    <input type="email" class="form-control" value="" name="email" required placeholder="email">

  </div>
</div>
 
<div class="form-group mb-3">
  <label class="mb-1"><strong>Password</strong></label>
  <input type="password" class="form-control" name="password" required placeholder="Password">
</div>

<div class="form-group mb-3">
  <div class="custom-control custom-checkbox ml-1">
    <input type="checkbox" class="form-check-input" id="remember">
    <label class="form-check-label" for="remember">Remember my preference</label>
  </div>
</div>

<div class="text-center form-group mb-3">
  <button type="submit" class="btn btn-primary btn-block">Sign In</button>
</div>
      
          
         
          
        </div>
      </form>

    
    
  </div>
</div>
</div>
</div>
</div>

</div>
</div>
</div>

<script>
  $(document).ready(function(){
    $('#login-form').submit(function(e){
    e.preventDefault()
    start_load()
    if($(this).find('.alert-danger').length > 0 )
      $(this).find('.alert-danger').remove();
    $.ajax({
      url:'ajax.php?action=login',
      method:'POST',
      data:$(this).serialize(),
      error:err=>{
        console.log(err)
        end_load();

      },
      success:function(resp){
        if(resp == 1){
          location.href ='index.php?page=home';
        }else{
          $('#login-form').prepend('<div class="alert alert-danger">Username or password is incorrect.</div>')
          end_load();
        }
      }
    })
  })
  })
</script>
<?php include 'footer.php' ?>

</body>


</html>
