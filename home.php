<?php include('db_connect.php') ?>

<?php
$twhere ="";
if($_SESSION['login_type'] != 1)
  $twhere = "  ";
?>

<div class="col-md-12 align-self-center">
                    <marquee direction="left" behavior="alternate" scrollamount=1 >
   <h6 style="color:red"><b>welcome !</b></h6>
</marquee></div>
<?php if($_SESSION['login_type'] == 1): ?>
        <div class="row">
          <div class="col-12 col-sm-6 col-md-4">
            <div class="small-box  shadow-sm border c-1">
              <div class="icon">
                <i class="fa fa-building"></i>
              </div>

              <div class="inner">
                 <p>Total Branches</p>
                <h3><?php echo $conn->query("SELECT * FROM branches")->num_rows; ?></h3>
              </div>
              
            </div>
          </div>
           <div class="col-12 col-sm-6 col-md-4 ">
            <div class="small-box shadow-sm border c-2">
              <div class="icon">
                <i class="fa fa-boxes"></i>
              </div>

              <div class="inner">
               <p>Total Parcels</p>
                <h3><?php echo $conn->query("SELECT * FROM parcels")->num_rows; ?></h3>

              </div>
            </div>
          </div>

           <div class="col-12 col-sm-6 col-md-4">
            <div class="small-box shadow-sm border c-3">
               <div class="icon">
                <i class="fa fa-users"></i>
              </div>

              <div class="inner">
                <p>Total Staff</p>
                <h3><?php echo $conn->query("SELECT * FROM users where type != 1")->num_rows; ?></h3>
              </div>
            </div>
          </div>
        
       
      </div>

      <div class="row">
        <div class="col-md-6">
          <div class="card card-outline ">
        <div class="card-body">
          <table class="table table-bordered" id="list">
            <thead>
                <tr>
                  <th>Sr.No</th>
                  <th>Status</th>
                  <th>Count</th>
                </tr>

              </thead>
              <tbody>
          <tr>
            <th>1</th>
            <th>Item Accepted by Courier  </th>
            <th>56</th>
          </tr>

          <tr>
            <th>2</th>
            <th>Collected</th>
            <th>50</th>
          </tr>
           <tr>
            <th>3</th>
            <th>Shiped</th>
            <th>78</th>
          </tr>
          <tr>
            <th>4</th>
            <th>In-Transit</th>
            <th>98</th>
          </tr>
          <tr>
            <th>5</th>
            <th>Out of Delivery</th>
            <th>128</th>
          </tr>

              </tbody> 
          </table>
          
        </div>
      </div>
 </div>
      <div class="col-md-6">
         <div id="piechart" style="width: 600px; height: 500px;"></div>
      </div>
   
  </div>

   <div class="row">
        <div class="col-md-12">
          <div class="card card-outline ">
        <div class="card-body">
  <div class="marquee-container">
    

<div style="width: 100%; overflow: hidden;">
  <marquee
    direction="down"
    behavior="alternate"
    scrollamount="4"
    onmouseover="this.stop();"
    onmouseout="this.start();"
  >
    
  </marquee>
</div>



  </div>
</div>
      </div>
 </div>

        
     
        
      </div>

<?php else: ?>
	 <div class="col-12">
          <div class="card">
          	<div class="card-body">
          		Welcome <?php echo $_SESSION['login_name'] ?>!
          	</div>
          </div>
      </div>
          
<?php endif; ?>
